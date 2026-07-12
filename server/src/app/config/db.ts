import mongoose from "mongoose";
import config from ".";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.db_uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
