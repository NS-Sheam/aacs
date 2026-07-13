import { ConnectionOptions, Queue } from "bullmq";
import { connection } from "../config/redis";

export interface CheckJobData {
  submissionId: string;
  assignmentId: string;
  liveUrl: string;
  githubUrl: string;
}

export const checkQueue = new Queue<CheckJobData>("check-queue", {
  connection: connection as ConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

console.log("Check queue initialized");
