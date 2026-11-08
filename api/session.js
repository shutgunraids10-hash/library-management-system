const { createHmac, randomBytes, scrypt: scryptCb, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const { getDb } = require("../lib/mongodb");
const { ObjectId } = require("mongodb");
const scrypt = promisify(scryptCb);
const COOKIE = "smartlib_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function sign(value) {
  return createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("base64url");
}

function cookieValue(req) {
  const cookies = Object.fromEntries((req.headers.cookie || "").split(";").map((s) => s.trim().split(/=(.*)/s).slice(0, 2)));
  return cookies[COOKIE];
}

async function readSession(req) {
  if (!process.env.SESSION_SECRET) return null;
  const token = cookieValue(req);
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (session.exp <= Date.now() || !ObjectId.isValid(session.id)) return null;
    const account = await (await getDb()).collection("users").findOne({ _id: new ObjectId(session.id), status: { $ne: "disabled" } }, { projection: { passwordHash: 0 } });
    return account ? { id: String(account._id), name: account.name, email: account.email, role: account.role, exp: session.exp } : null;
  } catch {
    return null;
  }
}

function setSession(req, res, user) {
  const payload = Buffer.from(JSON.stringify({ id: String(user._id), name: user.name, email: user.email, role: user.role, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const secure = process.env.VERCEL === "1" || forwardedProto === "https" || (!forwardedProto && process.env.NODE_ENV === "production");
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

module.exports = async function session(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const user = await readSession(req);
    return json(res, 200, { authenticated: Boolean(user), user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null, databaseConfigured: Boolean(process.env.MONGODB_URI) });
  }
  if (req.method === "DELETE") {
    clearSession(res);
    return json(res, 200, { authenticated: false });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return json(res, 405, { error: "Method not allowed" });
  }
  if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    return json(res, 503, { error: "Live sign-in is not configured. Set MongoDB and session environment variables." });
  }
  const { email, password } = req.body || {};
  if (typeof email !== "string" || typeof password !== "string" || password.length > 256) return json(res, 400, { error: "Enter a valid email and password." });
  try {
    const db = await getDb();
    const user = await db.collection("users").findOne({ email: email.trim().toLowerCase(), status: { $ne: "disabled" } });
    if (!user || !user.passwordHash) return json(res, 401, { error: "Email or password is incorrect." });
    const [salt, hash] = user.passwordHash.split(":");
    if (!salt || !hash) return json(res, 401, { error: "Email or password is incorrect." });
    const actual = await scrypt(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return json(res, 401, { error: "Email or password is incorrect." });
    setSession(req, res, user);
    return json(res, 200, { authenticated: true, user: { id: String(user._id), name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("SmartLib sign-in failed:", error.message);
    return json(res, 503, { error: "Could not connect to the library database." });
  }
};
module.exports.readSession = readSession;
