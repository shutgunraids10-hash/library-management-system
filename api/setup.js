const { randomBytes, scrypt: scryptCb, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const { getDb } = require("../lib/mongodb");
const { setSession } = require("./session");
const scrypt = promisify(scryptCb);

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function setupConfig() {
  const name = String(process.env.INITIAL_ADMIN_NAME || "").trim().slice(0, 120);
  const email = String(process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase().slice(0, 254);
  const previousEmail = String(process.env.INITIAL_ADMIN_PREVIOUS_EMAIL || "").trim().toLowerCase().slice(0, 254);
  const token = String(process.env.INITIAL_ADMIN_SETUP_TOKEN || "");
  const sessionSecretReady = String(process.env.SESSION_SECRET || "").length >= 32;
  const identityReady = Boolean(name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const tokenReady = token.length >= 32;
  return { name, email, previousEmail, token, identityReady, sessionSecretReady, tokenReady, enabled: Boolean(identityReady && tokenReady && sessionSecretReady) };
}

function validSetupToken(provided, expected) {
  const actual = Buffer.from(typeof provided === "string" ? provided : "");
  const secret = Buffer.from(expected);
  return secret.length >= 32 && actual.length === secret.length && timingSafeEqual(actual, secret);
}

module.exports = async function setup(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.MONGODB_URI) return json(res, 503, { error: "MongoDB is not configured." });

  const config = setupConfig();
  if (req.method === "GET") {
    if (!config.enabled) return json(res, 200, { available: false, configReady: false });
    try {
      const users = (await getDb()).collection("users");
      const count = await users.countDocuments({}, { limit: 1 });
      if (!count) return json(res, 200, { available: true, action: "create", name: config.name, email: config.email });
      const previousAdmin = config.previousEmail && config.previousEmail !== config.email
        ? await users.findOne({ email: config.previousEmail, role: "administrator", status: { $ne: "disabled" } }, { projection: { _id: 1 } })
        : null;
      return json(res, 200, previousAdmin
        ? { available: true, action: "change-email", name: config.name, email: config.email, previousEmail: config.previousEmail }
        : { available: false, configReady: true });
    } catch (error) {
      console.error("SmartLib setup status failed:", error.message);
      return json(res, 503, { error: "Could not check first-account setup." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed." });
  }
  if (!config.enabled || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) return json(res, 503, { error: "First-account setup is not configured." });
  if (!validSetupToken(req.headers["x-smartlib-setup-token"], config.token)) return json(res, 403, { error: "Setup token is invalid." });

  const { password, confirmation } = req.body || {};
  if (req.body?.action === "change-email") {
    if (!config.previousEmail || config.previousEmail === config.email) return json(res, 409, { error: "No previous administrator email is configured for update." });
    try {
      const users = (await getDb()).collection("users");
      const account = await users.findOneAndUpdate(
        { email: config.previousEmail, role: "administrator", status: { $ne: "disabled" } },
        { $set: { email: config.email, updatedAt: new Date() } },
        { returnDocument: "after", projection: { passwordHash: 0 } }
      );
      if (!account) return json(res, 409, { error: "The previous administrator account was not found or is disabled." });
      setSession(req, res, account);
      return json(res, 200, { updated: true, user: { id: String(account._id), name: account.name, email: account.email, role: account.role } });
    } catch (error) {
      if (error.code === 11000) return json(res, 409, { error: "An account already uses the new email address." });
      console.error("SmartLib administrator email update failed:", error.message);
      return json(res, 503, { error: "Could not update the administrator email." });
    }
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 256 || password !== confirmation) return json(res, 400, { error: "Use a matching password with at least 12 characters." });

  try {
    const db = await getDb();
    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });
    if (await users.countDocuments({}, { limit: 1 })) return json(res, 409, { error: "First-account setup has already been completed." });
    await db.collection("books").createIndex({ title: "text", author: "text", isbn: "text" });
    await db.collection("loans").createIndex({ userId: 1, status: 1, dueAt: 1 });
    await db.collection("reservations").createIndex({ userId: 1, status: 1, createdAt: -1 });

    const salt = randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);
    const now = new Date();
    const account = { name: config.name, email: config.email, passwordHash: `${salt}:${hash.toString("hex")}`, role: "administrator", status: "active", createdAt: now, updatedAt: now };
    const inserted = await users.insertOne(account);
    account._id = inserted.insertedId;
    setSession(req, res, account);
    return json(res, 201, { created: true, user: { id: String(account._id), name: account.name, email: account.email, role: account.role } });
  } catch (error) {
    if (error.code === 11000) return json(res, 409, { error: "First-account setup has already been completed." });
    console.error("SmartLib first-account setup failed:", error.message);
    return json(res, 503, { error: "Could not create the first administrator account." });
  }
};
