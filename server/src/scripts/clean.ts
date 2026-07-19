import dotenv from "dotenv";
import mongoose from "mongoose";

import { ReviewQueue } from "../app/modules/reviewQueue/reviewQueue.model";
import { Submission } from "../app/modules/submission/submission.model";

dotenv.config();

async function clean() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in the environment variables.");
  }

  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  const subs = await Submission.find({}, "_id").lean();
  const subIds = subs.map((s) => s._id);

  const result = await ReviewQueue.deleteMany({
    submissionId: { $nin: subIds },
  });

  console.log(`🗑️ Deleted orphaned review queue items: ${result.deletedCount}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
}

clean().catch((error) => {
  console.error("❌ Cleanup failed:", error);
  process.exit(1);
});
