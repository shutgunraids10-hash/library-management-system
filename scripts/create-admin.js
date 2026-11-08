const { scrypt: scryptCb, randomBytes } = require("node:crypto");
const { promisify } = require("node:util");
const { MongoClient } = require("mongodb");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const scrypt = promisify(scryptCb);

async function main() {
  const [name, email, requestedRole = "administrator"] = process.argv.slice(2);
  if (!process.env.MONGODB_URI || !name || !email || !["administrator", "librarian", "student"].includes(requestedRole)) {
    console.error("Usage: npm run create-admin -- \"Name\" email [administrator|librarian|student]\nSet MONGODB_URI in .env.local first.");
    process.exitCode = 1;
    return;
  }
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  const password = await prompt.question("Password (at least 12 characters): ");
  await prompt.close();
  if (password.length < 12) { console.error("Password must be at least 12 characters."); process.exitCode = 1; return; }
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || undefined);
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("books").createIndex({ title: "text", author: "text", isbn: "text" });
    await db.collection("loans").createIndex({ userId: 1, status: 1, dueAt: 1 });
    await db.collection("reservations").createIndex({ userId: 1, status: 1, createdAt: -1 });
    const normalizedEmail = email.trim().toLowerCase();
    if (await db.collection("users").findOne({ email: normalizedEmail })) throw new Error("An account with that email already exists.");
    const salt = randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);
    await db.collection("users").insertOne({ name: name.trim(), email: normalizedEmail, passwordHash: `${salt}:${hash.toString("hex")}`, role: requestedRole, status: "active", createdAt: new Date(), updatedAt: new Date() });
    console.log(`${requestedRole} account created for ${normalizedEmail}.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
