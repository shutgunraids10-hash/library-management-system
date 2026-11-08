const { ObjectId } = require("mongodb");
const { randomBytes, scrypt: scryptCb } = require("node:crypto");
const { promisify } = require("node:util");
const { getDb, getClient } = require("../lib/mongodb");
const { readSession } = require("./session");
const { issueReservationLoan } = require("../lib/loans");
const scrypt = promisify(scryptCb);

const allowed = new Set(["books", "loans", "reservations", "users", "settings"]);
const json = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };
const canManage = (user) => user && ["librarian", "administrator"].includes(user.role);
const copyCount = (value, fallback = 1) => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, Math.min(1000000, Math.floor(parsed))) : fallback; };

module.exports = async function records(req, res) {
  const user = await readSession(req);
  const type = String(req.query?.type || "");
  if (!allowed.has(type)) return json(res, 400, { error: "Unknown record type." });
  if (type === "users" && !canManage(user)) return json(res, 403, { error: "Staff access is required." });
  if (type === "settings" && (!user || user.role !== "administrator")) return json(res, 403, { error: "Administrator access is required." });
  if (type !== "books" && !user) return json(res, 401, { error: "Sign in to view this information." });
  if (req.method === "GET") {
    try {
      const db = await getDb();
      if (type === "settings") {
        const item = await db.collection("settings").findOne({ _id: "library" });
        return json(res, 200, { item: item || { _id: "library", libraryName: "Northview Community Library", contactEmail: "library@northview.edu", loanPeriod: 14 } });
      }
      const query = type === "loans" || type === "reservations" ? (canManage(user) ? {} : { userId: user.id }) : {};
      const rows = await db.collection(type).find(query, { projection: type === "users" ? { passwordHash: 0 } : undefined }).sort({ updatedAt: -1, createdAt: -1 }).limit(500).toArray();
      return json(res, 200, { items: rows.map((row) => ({ ...row, _id: String(row._id) })) });
    } catch (error) {
      console.error(`SmartLib ${type} read failed:`, error.message);
      return json(res, 503, { error: "Could not load records from MongoDB." });
    }
  }
  if (type === "users" && !["POST", "PATCH"].includes(req.method)) return json(res, 405, { error: "User records are managed by an administrator." });
  if (type === "settings" && req.method !== "PATCH") return json(res, 405, { error: "Settings can only be updated with PATCH." });
  if (req.method === "POST") {
    if (type === "users") {
      if (user.role !== "administrator") return json(res, 403, { error: "Administrator access is required." });
      const body = req.body || {};
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
      const password = typeof body.password === "string" ? body.password : "";
      const role = body.role;
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || password.length > 256 || !["student", "librarian", "administrator"].includes(role)) {
        return json(res, 400, { error: "Enter a name, valid email, 12-character password, and a valid library role." });
      }
      try {
        const db = await getDb();
        const salt = randomBytes(16).toString("hex");
        const hash = await scrypt(password, salt, 64);
        const now = new Date();
        const account = { name, email, passwordHash: `${salt}:${hash.toString("hex")}`, role, status: "active", createdAt: now, updatedAt: now };
        const inserted = await db.collection("users").insertOne(account);
        return json(res, 201, { item: { _id: String(inserted.insertedId), name, email, role, status: "active", createdAt: now } });
      } catch (error) {
        if (error.code === 11000) return json(res, 409, { error: "An account with that email already exists." });
        console.error("SmartLib account creation failed:", error.message);
        return json(res, 503, { error: "Could not create the account in MongoDB." });
      }
    }
    if (type === "books" && !canManage(user)) return json(res, 403, { error: "Librarian access is required." });
    if (type === "loans" && !canManage(user)) return json(res, 403, { error: "Librarian access is required." });
    if (type === "reservations" && user.role !== "student") return json(res, 403, { error: "Student access is required." });
    const body = req.body || {};
    if (type === "books" && (!body.title || !body.author || !body.category)) return json(res, 400, { error: "Title, author, and category are required." });
    if (type === "reservations" && !body.bookId) return json(res, 400, { error: "Select a book to reserve." });
    const now = new Date();
    const record = type === "books"
      ? { title: String(body.title).trim().slice(0, 160), author: String(body.author).trim().slice(0, 120), category: String(body.category).trim().slice(0, 80), isbn: String(body.isbn || "").trim().slice(0, 32), shelf: String(body.shelf || "Unassigned").trim().slice(0, 32), copies: copyCount(body.copies), available: copyCount(body.copies), status: "active", createdAt: now, updatedAt: now }
      : type === "loans"
        ? { bookId: String(body.bookId || ""), userId: String(body.userId || ""), status: "borrowed", checkedOutAt: now, dueAt: body.dueAt && !Number.isNaN(new Date(body.dueAt).getTime()) ? new Date(body.dueAt) : new Date(Date.now() + 14 * 86400000), createdAt: now, updatedAt: now }
        : { bookId: String(body.bookId), bookTitle: String(body.bookTitle || "").slice(0, 160), userId: user.id, userName: user.name, status: "pending", createdAt: now, updatedAt: now };
    let checkedOutBookId = null;
    try {
      const db = await getDb();
      if (type === "loans" && !body.dueAt) {
        const settings = await db.collection("settings").findOne({ _id: "library" }, { projection: { loanPeriod: 1 } });
        const loanPeriod = [7, 14, 21].includes(Number(settings?.loanPeriod)) ? Number(settings.loanPeriod) : 14;
        record.dueAt = new Date(Date.now() + loanPeriod * 86400000);
      }
      if (type === "reservations") {
        if (!ObjectId.isValid(record.bookId)) return json(res, 400, { error: "Book ID is invalid." });
        const book = await db.collection("books").findOne({ _id: new ObjectId(record.bookId), status: "active", available: { $gt: 0 } });
        if (!book) return json(res, 409, { error: "That book is currently unavailable." });
        record.bookTitle = book.title;
        const duplicate = await db.collection("reservations").findOne({ bookId: record.bookId, userId: user.id, status: "pending" });
        if (duplicate) return json(res, 409, { error: "You already have a pending request for this title." });
      }
      if (type === "loans") {
        if (!ObjectId.isValid(body.bookId) || !ObjectId.isValid(body.userId)) return json(res, 400, { error: "Select a valid book and member." });
        const member = await db.collection("users").findOne({ _id: new ObjectId(body.userId), status: { $ne: "disabled" } }, { projection: { passwordHash: 0 } });
        if (!member) return json(res, 404, { error: "Member account not found." });
        const book = await db.collection("books").findOne({ _id: new ObjectId(body.bookId), status: "active" });
        if (!book) return json(res, 404, { error: "Book not found." });
        const updated = await db.collection("books").updateOne({ _id: book._id, status: "active", available: { $gt: 0 } }, { $inc: { available: -1 }, $set: { updatedAt: now } });
        if (!updated.modifiedCount) return json(res, 409, { error: "That book is currently unavailable." });
        checkedOutBookId = book._id;
        record.bookId = String(book._id);
        record.title = book.title;
        record.author = book.author;
        record.userId = String(member._id);
        record.user = member.name;
        record.email = member.email;
      }
      const inserted = await db.collection(type).insertOne(record);
      return json(res, 201, { item: { ...record, _id: String(inserted.insertedId) } });
    } catch (error) {
      if (checkedOutBookId) {
        try { await (await getDb()).collection("books").updateOne({ _id: checkedOutBookId }, { $inc: { available: 1 } }); } catch (rollbackError) { console.error("SmartLib checkout rollback failed:", rollbackError.message); }
      }
      console.error(`SmartLib ${type} create failed:`, error.message);
      return json(res, 503, { error: "Could not save this record to MongoDB." });
    }
  }
  if (req.method === "PATCH") {
    if (!canManage(user)) return json(res, 403, { error: "Librarian access is required." });
    const { id, updates = {} } = req.body || {};
    if (type === "users") {
      if (user.role !== "administrator") return json(res, 403, { error: "Administrator access is required." });
      const requestedStatus = updates && typeof updates === "object" ? updates.status : "";
      if (!ObjectId.isValid(id) || !["active", "disabled"].includes(requestedStatus)) return json(res, 400, { error: "Choose active or disabled account access." });
      if (String(id) === user.id && requestedStatus === "disabled") return json(res, 409, { error: "You cannot disable your own account." });
      try {
        const result = await (await getDb()).collection("users").updateOne({ _id: new ObjectId(id) }, { $set: { status: requestedStatus, updatedAt: new Date() } });
        return result.matchedCount ? json(res, 200, { updated: true, status: requestedStatus }) : json(res, 404, { error: "Account not found." });
      } catch (error) {
        console.error("SmartLib account update failed:", error.message);
        return json(res, 503, { error: "Could not update account access." });
      }
    }
    if (type === "settings") {
      if (user.role !== "administrator") return json(res, 403, { error: "Administrator access is required." });
      const libraryName = typeof updates.libraryName === "string" ? updates.libraryName.trim().slice(0, 120) : "";
      const contactEmail = typeof updates.contactEmail === "string" ? updates.contactEmail.trim().toLowerCase().slice(0, 254) : "";
      const loanPeriod = Number(updates.loanPeriod);
      if (libraryName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || ![7, 14, 21].includes(loanPeriod)) return json(res, 400, { error: "Enter a library name, valid contact email, and a 7, 14, or 21 day loan period." });
      try {
        const item = { _id: "library", libraryName, contactEmail, loanPeriod, updatedAt: new Date() };
        await (await getDb()).collection("settings").updateOne({ _id: "library" }, { $set: item }, { upsert: true });
        return json(res, 200, { item });
      } catch (error) {
        console.error("SmartLib settings update failed:", error.message);
        return json(res, 503, { error: "Could not save library settings." });
      }
    }
    if (!ObjectId.isValid(id)) return json(res, 400, { error: "Record ID is invalid." });
    const inputUpdates = updates && typeof updates === "object" && !Array.isArray(updates) ? updates : {};
    if (type === "loans" && Object.hasOwn(inputUpdates, "status") && inputUpdates.status !== "returned") return json(res, 400, { error: "A loan can only be marked returned." });
    if (type === "reservations" && Object.hasOwn(inputUpdates, "status") && !["approved", "declined"].includes(inputUpdates.status)) return json(res, 400, { error: "Choose approved or declined for a reservation." });
    if (type === "reservations" && Object.hasOwn(inputUpdates, "action") && inputUpdates.action !== "checkout-approved") return json(res, 400, { error: "Choose a valid request action." });
    const allowedFields = type === "books" ? ["title", "author", "category", "isbn", "shelf", "copies", "status"] : type === "loans" ? ["status", "dueAt"] : ["status"];
    const safe = Object.fromEntries(Object.entries(inputUpdates).filter(([key]) => allowedFields.includes(key)));
    if (!Object.keys(safe).length && !(type === "reservations" && inputUpdates.action === "checkout-approved")) return json(res, 400, { error: "No editable fields were provided." });
    safe.updatedAt = new Date();
    try {
      const db = await getDb();
      if (type === "reservations" && (safe.status === "approved" || inputUpdates.action === "checkout-approved")) {
        try {
          const loan = await issueReservationLoan({
            db,
            client: await getClient(),
            reservationId: id,
            reviewer: user,
            expectedStatus: safe.status === "approved" ? "pending" : "approved"
          });
          return json(res, 200, { updated: true, loan });
        } catch (error) {
          if (error.httpStatus) return json(res, error.httpStatus, { error: error.message });
          throw error;
        }
      }
      if (type === "books") {
        if (Object.hasOwn(safe, "status") && !["active", "archived"].includes(safe.status)) return json(res, 400, { error: "Book status must be active or archived." });
        for (const [field, max] of Object.entries({ title: 160, author: 120, category: 80, isbn: 32, shelf: 32 })) {
          if (Object.hasOwn(safe, field)) {
            if (typeof safe[field] !== "string" || !safe[field].trim()) return json(res, 400, { error: `${field} must be a non-empty string.` });
            safe[field] = safe[field].trim().slice(0, max);
          }
        }
      }
      if (type === "loans" && Object.hasOwn(safe, "dueAt")) {
        const dueAt = new Date(safe.dueAt);
        if (Number.isNaN(dueAt.getTime())) return json(res, 400, { error: "Due date is invalid." });
        safe.dueAt = dueAt;
      }
      if (type === "books" && Object.hasOwn(safe, "copies")) {
        const copies = Number(safe.copies);
        if (!Number.isInteger(copies) || copies < 0 || copies > 1000000) return json(res, 400, { error: "Copy count must be a non-negative whole number." });
        const inUse = await db.collection("loans").countDocuments({ bookId: id, status: { $ne: "returned" } });
        if (copies < inUse) return json(res, 409, { error: `At least ${inUse} copies are still checked out.` });
        safe.copies = copies;
        safe.available = copies - inUse;
      }
      if (type === "loans" && safe.status === "returned") {
        safe.returnedAt = new Date();
        const loan = await db.collection("loans").findOneAndUpdate({ _id: new ObjectId(id), status: { $ne: "returned" } }, { $set: safe }, { returnDocument: "after" });
        if (!loan) return json(res, 409, { error: "This loan has already been returned." });
        if (loan.bookId && ObjectId.isValid(loan.bookId)) {
          await db.collection("books").updateOne({ _id: new ObjectId(loan.bookId) }, [{ $set: { available: { $min: [{ $add: [{ $ifNull: ["$available", 0] }, 1] }, { $ifNull: ["$copies", 0] }] }, updatedAt: new Date() } }]);
        }
        return json(res, 200, { updated: true });
      }
      if (type === "reservations" && ["approved", "declined"].includes(safe.status)) {
        safe.reviewedAt = new Date();
        safe.reviewedBy = user.name;
        const result = await db.collection("reservations").updateOne({ _id: new ObjectId(id), status: "pending" }, { $set: safe });
        return result.matchedCount ? json(res, 200, { updated: true }) : json(res, 409, { error: "This request has already been reviewed." });
      }
      const result = await db.collection(type).updateOne({ _id: new ObjectId(id) }, { $set: safe });
      return result.matchedCount ? json(res, 200, { updated: true }) : json(res, 404, { error: "Record not found." });
    } catch (error) {
      if (error.httpStatus) return json(res, error.httpStatus, { error: error.message });
      console.error(`SmartLib ${type} update failed:`, error.message);
      return json(res, 503, { error: "Could not update the record in MongoDB." });
    }
  }
  if (req.method === "DELETE") {
    if (!canManage(user) || type !== "books") return json(res, 403, { error: "Librarian access is required." });
    const id = String(req.query?.id || "");
    if (!ObjectId.isValid(id)) return json(res, 400, { error: "Record ID is invalid." });
    try {
      const db = await getDb();
      const bookId = new ObjectId(id);
      const book = await db.collection("books").findOne({ _id: bookId }, { projection: { status: 1 } });
      if (!book) return json(res, 404, { error: "Book not found." });
      if (book.status !== "archived") return json(res, 409, { error: "Archive the book before permanently deleting it." });
      const activeLoans = await db.collection("loans").countDocuments({ bookId: id, status: { $ne: "returned" } });
      if (activeLoans) return json(res, 409, { error: "This book cannot be deleted while copies are checked out." });
      const pendingRequests = await db.collection("reservations").countDocuments({ bookId: id, status: "pending" });
      if (pendingRequests) return json(res, 409, { error: "Resolve pending reservations before permanently deleting this book." });
      await db.collection("books").deleteOne({ _id: bookId, status: "archived" });
      return json(res, 200, { deleted: true });
    } catch (error) {
      console.error("SmartLib book archive failed:", error.message);
      return json(res, 503, { error: "Could not archive the book." });
    }
  }
  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return json(res, 405, { error: "Method not allowed." });
};
