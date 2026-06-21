import { MongoClient } from 'mongodb';

// Lazy connection — connecting at module-import time risks crashing any
// serverless function that happens to bundle this module in a shared
// chunk (even ones that never call getDb()), if the URI is missing or
// the network rejects the connection. Only connect when actually asked to.
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return Promise.reject(new Error('MONGODB_URI is not set'));
  }
  if (!clientPromise) {
    const client = new MongoClient(uri, {});
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db('clearpath');
}
