import mongoose from "mongoose";
import { ReviewQueue } from "../app/modules/reviewQueue/reviewQueue.model";
import { Submission } from "../app/modules/submission/submission.model";

async function clean() {
  const uri = "mongodb+srv://simple-crud:0TxCL5jZ9DIMozhh@ccluster0.5pxwvij.mongodb.net/devengers-aacs2?retryWrites=true&w=majority";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const subs = await Submission.find({}, "_id").lean();
  const subIds = subs.map(s => s._id);

  const result = await ReviewQueue.deleteMany({
    submissionId: { $nin: subIds }
  });
  console.log("Deleted orphaned review queue items:", result.deletedCount);

  await mongoose.disconnect();
}

clean().catch(console.error);
