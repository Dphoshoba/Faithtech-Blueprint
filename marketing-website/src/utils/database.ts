import mongoose, { Connection, Mongoose as MongooseInstanceType } from 'mongoose'; // Import Connection and Mongoose types

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/faithtech-marketing';

// Define the structure of our cache object
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<MongooseInstanceType> | null;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 * global.mongooseCache is declared in next-env.d.ts
 */
// Use 'as any' for broader compatibility if global augmentation is tricky
let cached: MongooseCache | undefined = (global as any).mongooseCache;

if (!cached) {
  cached = (global as any).mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<Connection> {
  if (cached?.conn) { // Check if cached itself exists
    return cached.conn;
  }

  // If cached is still undefined here, it means global.mongooseCache was also undefined.
  // Initialize it directly on global for this process.
  if (!cached) {
    cached = (global as any).mongooseCache = { conn: null, promise: null };
  }
  
  // Ensure cached is not undefined for the promise logic
  // This reassignment is mainly for type narrowing within this function scope
  // if the global was initially undefined.
  const currentCache = cached;

  if (!currentCache.promise) {
    const opts = {
      bufferCommands: false,
    };
    // mongoose.connect() returns a Promise that resolves to the Mongoose instance (typeof mongoose)
    currentCache.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    // Wait for the connection to be established
    const mongooseInstance = await currentCache.promise;
    // Assign the actual connection object to currentCache.conn
    currentCache.conn = mongooseInstance.connection;
  } catch (e) {
    currentCache.promise = null; // Reset promise on error
    throw e;
  }
  
  if (!currentCache.conn) {
    // This case should ideally not be reached if connect resolves successfully.
    // Handle it as an error or throw, as returning null/undefined might not be expected by callers.
    throw new Error('Failed to establish Mongoose connection.');
  }

  return currentCache.conn;
}

export default connectToDatabase;
