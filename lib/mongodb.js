const { MongoClient } = require("mongodb");

async function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!global._smartlibMongoClientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
    global._smartlibMongoClientPromise = client.connect();
  }
  return global._smartlibMongoClientPromise;
}

async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || undefined);
}

module.exports = { getDb, getClient };
