const { MongoClient } = require("mongodb");

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  let clientPromise;
  if (process.env.NODE_ENV === "development") {
    if (!global._smartlibMongoClientPromise) {
      const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
      global._smartlibMongoClientPromise = client.connect();
    }
    clientPromise = global._smartlibMongoClientPromise;
  } else {
    if (!global._smartlibMongoClientPromise) {
      const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
      global._smartlibMongoClientPromise = client.connect();
    }
    clientPromise = global._smartlibMongoClientPromise;
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || undefined);
}

module.exports = { getDb };
