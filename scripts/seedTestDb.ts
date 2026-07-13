import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const requireFromServer = createRequire(`${process.cwd()}/package.json`);
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

const assignment1Path = path.resolve(
  process.cwd(),
  "../scripts/test-data/assignment1.json",
);

function loadStudents(): StudentSubmission[] {
  return JSON.parse(readFileSync(studentsPath, "utf8"));
}

function loadAssignment1Requirements(): Record<string, any> {
  return JSON.parse(readFileSync(assignment1Path, "utf8"));
}

async function seed() {
  try {
    const students = loadStudents();
    const assignment1Reqs = loadAssignment1Requirements();

    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    const args = process.argv.slice(2);
    const shouldReset = args.includes("--reset");

    if (shouldReset) {
      await Promise.all([
        Assignment.deleteMany({}),
        Submission.deleteMany({}),
      ]);
      console.log("Collections cleared via --reset");
    }

    // Seed Assignment 1
    const assignment1 = await Assignment.findOneAndUpdate(
      { assignmentNo: 1, batch: 12 },
      {
        assignmentNo: 1,
        batch: 12,
        title: "Assignment 1 - Focus App UI",
        figmaUrl:
          "https://www.figma.com/design/J1jPSSrMS37gtznGyvURIL/web-flow-A01?node-id=2-554&p=f",
        originalRequirements: assignment1Reqs,
        confidenceThreshold: 0.75,
        status: "active",
        version: 1,
      },
      { returnDocument: "after", upsert: true },
    );

    console.log(`Seeded assignment: ${assignment1.title}`);

    // Seed submissions for Assignment 1
    await Submission.deleteMany({ assignmentId: assignment1._id });

    const submissions = await Submission.insertMany(
      students.map((student) => ({
        assignmentId: assignment1._id,
        studentName: student.studentName,
        liveUrl: student.liveUrl,
        githubUrl: student.githubUrl,
        status: "queued",
        progress: { completedChecks: 0, totalChecks: 0 },
      })),
    );

    console.log(`Inserted submissions: ${submissions.length}`);

    const savedSubmissions = await Submission.find({
      assignmentId: assignment1._id,
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
