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
const { Result } = requireFromServer(
  "./src/app/modules/result/result.model",
);
const { ReviewQueue } = requireFromServer(
  "./src/app/modules/reviewQueue/reviewQueue.model",
);
const { AuditLog } = requireFromServer(
  "./src/app/modules/auditLog/auditLog.model",
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

const assignment11Path = path.resolve(
  process.cwd(),
  "../scripts/test-data/assignment11.json",
);

function loadStudents(): StudentSubmission[] {
  const content = readFileSync(studentsPath, "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

function loadAssignment1Requirements(): Record<string, any> {
  const content = readFileSync(assignment1Path, "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

function loadAssignment11Requirements(): Record<string, any> {
  const content = readFileSync(assignment11Path, "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
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
        Result.deleteMany({}),
        ReviewQueue.deleteMany({}),
        AuditLog.deleteMany({}),
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
        enrichedRequirements: {
          "Navbar": {
            "req-1": {
              "description": "logo/website name on the left",
              "number": "2",
              "correct": true,
              "message": "not okay.",
              "checkType": "ui-position",
              "automationTier": 1,
              "selectors": ["nav .logo", "header .logo", "nav img", "nav svg"],
              "requiredState": { "position": "left" },
              "confidence": 0.9,
              "needsClarification": false
            },
            "req-2": {
              "description": "Signup button on the right",
              "number": "2",
              "correct": true,
              "message": "not okay.",
              "checkType": "ui-position",
              "automationTier": 1,
              "selectors": ["nav button.signup", "a[href*='signup']"],
              "requiredState": { "position": "right" },
              "confidence": 0.5,
              "needsClarification": false
            }
          }
        }
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

    // Seed Assignment 11
    const assignment11Reqs = loadAssignment11Requirements();
    const assignment11 = await Assignment.findOneAndUpdate(
      { assignmentNo: 11, batch: 12 },
      {
        assignmentNo: 11,
        batch: 12,
        title: "Assignment 11 - Scholarship Portal",
        figmaUrl: "https://www.figma.com/design/example-figma-a11",
        originalRequirements: assignment11Reqs,
        confidenceThreshold: 0.75,
        status: "active",
        version: 1,
        dbSeedConfig: {
          roles: [
            { role: "student", email: "student@test.com", password: "Test@1234" },
            { role: "moderator", email: "moderator@test.com", password: "Test@1234" },
            { role: "admin", email: "admin@test.com", password: "Test@1234" }
          ],
          sampleData: { scholarships: 6 }
        }
      },
      { returnDocument: "after", upsert: true },
    );

    console.log(`Seeded assignment: ${assignment11.title}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Seeder error:", error);
    process.exit(1);
  }
}

seed();
