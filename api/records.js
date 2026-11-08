const { ObjectId } = require("mongodb");
const { getDb } = require("../lib/mongodb");
const { readSession } = require("./session");

const allowed = new Set(["books", "loans", "reservations", "users"]);
const roles = new Set(["student", "librarian", "administrator"]);
const json = (res, status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };
const canManage = (user) => user && ["librarian", "administrator"].includes(user.role);

module.exports = async function records(req, res) {
  const user = readSession(req);
  const type = String(req.query?.type || "");
  if (!allowed.has(type)) return json(res, 400, { error: "Unknown record type." });
  if (type === "users" && (!user || !canManage(user))) return json(res, 403, { error: "Staff access is required." });
  if (type !== "books" && !user) return json(res, 401, { error: "Sign in to view this information." });
  if (req.method === "GET") {
    try {
      const db = await getDb();
      const query = type === "loans" || type === "reservations" ? (canManage(user) ? {} : { userId: user.id }) : {};
      const rows = await db.collection(type).find(query, { projection: type === "users" ? { passwordHash: 0 } : undefined }).sort({ updatedAt: -1, createdAt: -1 }).limit(500).toArray();
      return json(res, 200, { items: rows.map((row) => ({ ...row, _id: String(row._id) })) });
    } catch (error) {
      console.error(`SmartLib ${type} read failed:`, error.message);
      return json(res, 503, { error: "Could not load records from MongoDB." });
    }
  }
  if (type === "users") return json(res, 405, { error: "User records are managed by an administrator." });
  if (req.method === "POST") {
    if (type === "books" && !canManage(user)) return json(res, 403, { error: "Librarian access is required." });
    if (type === "loans" && !canManage(user)) return json(res, 403, { error: "Librarian access is required." });
    if (type === "reservations" && user.role !== "student") return json(res, 403, { error: "Student access is required." });
    const body = req.body || {};
    if (type === "books" && (!body.title || !body.author || !body.category)) return json(res, 400, { error: "Title, author, and category are required." });
    if (type === "reservations" && !body.bookId) return json(res, 400, { error: "Select a book to reserve." });
    const now = new Date();
    const record = type === "books"
      ? { title: String(body.title).slice(0, 160), author: String(body.author).slice(0, 120), category: String(body.category).slice(0, 80), isbn: String(body.isbn || "").slice(0, 32), shelf: String(body.shelf || "Unassigned").slice(0, 32), copies: Math.max(0, Number(body.copies) || 1), available: Math.max(0, Number(body.copies) || 1), status: "active", createdAt: now, updatedAt: now }
      : type === "loans"
        ? { ...body, userId: String(body.userId || ""), status: "borrowed", checkedOutAt: now, dueAt: body.dueAt ? new Date(body.dueAt) : new Date(Date.now() + 14 * 86400000), createdAt: now, updatedAt: now }
        : { bookId: String(body.bookId), bookTitle: String(body.bookTitle || "").slice(0, 160), userId: user.id, userName: user.name, status: "pending", createdAt: now, updatedAt: now };
    try {
      const db = await getDb();
      if (type === "reservations") {
        if (!ObjectId.isValid(record.bookId)) return json(res, 400, { error: "Book ID is invalid." });
        const book = await db.collection("books").findOne({ _id: new ObjectId(record.bookId), status: "active", available: { $gt: 0 } });
        if (!book) return json(res, 409, { error: "That book is currently unavailable." });
      }
      if (type === "loans") {
        if (!ObjectId.isValid(body.bookId) || !ObjectId.isValid(body.userId)) return json(res, 400, { error: "Select a valid book and member." });
        const updated = await db.collection("books").updateOne({ _id: new ObjectId(body.bookId), status: "active", available: { $gt: 0 } }, { $inc: { available: -1 }, $set: { updatedAt: now } });
        if (!updated.modifiedCount) return json(res, 409, { error: "That book is currently unavailable." });
        const member = await db.collection("users").findOne({ _id: new ObjectId(body.userId), status: { $ne: "disabled" } }, { projection: { passwordHash: 0 } });
        if (!member) { await db.collection("books").updateOne({ _id: new ObjectId(body.bookId) }, { $inc: { available: 1 } }); return json(res, 404, { error: "Member account not found." }); }
        record.userId = String(member._id);
        record.user = member.name;
        record.email = member.email;
      }
      const inserted = await db.collection(type).insertOne(record);
      return json(res, 201, { item: { ...record, _id: String(inserted.insertedId) } });
    } catch (error) {
      console.error(`SmartLib ${type} create failed:`, error.message);
      return json(res, 503, { error: "Could not save this record to MongoDB." });
    }
  }
  if (req.method === "PATCH") {
    if (!canManage(user)) return json(res, 403, { error: "Librarian access is required." });
    const { id, updates = {} } = req.body || {};
    if (!ObjectId.isValid(id)) return json(res, 400, { error: "Record ID is invalid." });
    const allowedFields = type === "books" ? ["title", "author", "category", "isbn", "shelf", "copies", "available", "status"] : type === "loans" ? ["status", "dueAt", "returnedAt"] : ["status", "reviewedAt", "reviewedBy"];
    const safe = Object.fromEntries(Object.entries(updates).filter(([key]) => allowedFields.includes(key)));
    if (!Object.keys(safe).length) return json(res, 400, { error: "No editable fields were provided." });
    safe.updatedAt = new Date();
    try {
      const db = await getDb();
      const result = await db.collection(type).updateOne({ _id: new ObjectId(id) }, { $set: safe });
      if (result.matchedCount && type === "loans" && safe.status === "returned") {
        const loan = await db.collection("loans").findOne({ _id: new ObjectId(id) });
        if (loan?.bookId && ObjectId.isValid(loan.bookId)) await db.collection("books").updateOne({ _id: new ObjectId(loan.bookId) }, { $inc: { available: 1 }, $set: { updatedAt: new Date() } });
      }
      return result.matchedCount ? json(res, 200, { updated: true }) : json(res, 404, { error: "Record not found." });
    } catch (error) {
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
      const result = await db.collection("books").updateOne({ _id: new ObjectId(id) }, { $set: { status: "archived", updatedAt: new Date() } });
      return result.matchedCount ? json(res, 200, { archived: true }) : json(res, 404, { error: "Book not found." });
    } catch (error) {
      console.error("SmartLib book archive failed:", error.message);
      return json(res, 503, { error: "Could not archive the book." });
    }
  }
  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return json(res, 405, { error: "Method not allowed." });
};
