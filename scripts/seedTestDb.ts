import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const requireFromServer = createRequire(`${process.cwd()}/package.json`);
const bcrypt = requireFromServer("bcryptjs");
const dotenv = requireFromServer("dotenv");
const mongoose = requireFromServer("mongoose");
const { Assignment } = requireFromServer(
  "./src/app/modules/assignment/assignment.model",
);
const { Submission } = requireFromServer(
  "./src/app/modules/submission/submission.model",
);

dotenv.config({ path: ".env" });

type StudentSubmission = {
  studentName: string;
  liveUrl: string;
  githubUrl: string;
};

type SavedSubmission = StudentSubmission & {
  status: string;
};

const studentsPath = path.resolve(
  process.cwd(),
  "../scripts/test-data/assignment1-students.json",
);

function loadStudents(): StudentSubmission[] {
  return JSON.parse(readFileSync(studentsPath, "utf8"));
}

async function seed() {
  try {
    const students = loadStudents();

    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    // Day 4 can expand these credentials into real role-based app seed data.
    const adminPassword = await bcrypt.hash("admin123", 8);
    const studentPassword = await bcrypt.hash("student123", 8);

    const assignment = await Assignment.findOneAndUpdate(
      { title: "Assignment 1 - Focus App UI", batch: 12 },
      {
        title: "Assignment 1 - Focus App UI",
        batch: 12,
        originalRequirements: {
          source: "scripts/test-data/assignment1-students.json",
          note: "Seed assignment used for local checker development.",
        },
        dbSeedConfig: {
          roles: [
            {
              role: "admin",
              email: "admin@example.com",
              password: adminPassword,
            },
            {
              role: "student",
              email: "student@example.com",
              password: studentPassword,
            },
          ],
          sampleData: { submissionCount: students.length },
        },
        confidenceThreshold: 0.75,
        status: "active",
      },
      { returnDocument: "after", upsert: true },
    );

    console.log(`Seeded assignment: ${assignment.title}`);

    await Submission.deleteMany({ assignmentId: assignment._id });

    const submissions = await Submission.insertMany(
      students.map((student) => ({
        assignmentId: assignment._id,
        studentName: student.studentName,
        liveUrl: student.liveUrl,
        githubUrl: student.githubUrl,
        status: "queued",
        progress: { completedChecks: 0, totalChecks: 0 },
      })),
    );

    console.log(`Inserted submissions: ${submissions.length}`);

    const savedSubmissions = await Submission.find({
      assignmentId: assignment._id,
    }).lean();

    console.log("Submissions currently saved in MongoDB:");
    console.table(
      savedSubmissions.map((submission: SavedSubmission) => ({
        studentName: submission.studentName,
        liveUrl: submission.liveUrl,
        githubUrl: submission.githubUrl,
        status: submission.status,
      })),
    );

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Seeder error:", error);
    process.exit(1);
  }
}

seed();
