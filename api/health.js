const { getDb } = require("../lib/mongodb");
module.exports = async function health(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.statusCode = 405; return res.end(); }
  if (!process.env.MONGODB_URI) {
    res.statusCode = process.env.REQUIRE_DATABASE === "1" ? 503 : 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ database: "not-configured", mode: process.env.REQUIRE_DATABASE === "1" ? "unavailable" : "preview" }));
  }
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ database: "connected", mode: "live" }));
  } catch (error) {
    console.error("SmartLib health check failed:", error.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ database: "unavailable", mode: "unavailable" }));
  }
};
