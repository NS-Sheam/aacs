import { Assignment } from "./assignment.model";

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateAssignmentDTO {
  assignmentNo: number;
  batch: number;
  title: string;
  figmaUrl?: string;
  originalRequirements: Record<string, any>;
  dbSeedConfig?: {
    roles: Array<{ role: string; email: string; password: string }>;
    sampleData?: Record<string, any>;
  };
  confidenceThreshold?: number;
}

export interface UpdateAssignmentDTO {
  title?: string;
  figmaUrl?: string;
  originalRequirements?: Record<string, any>;
  dbSeedConfig?: {
    roles: Array<{ role: string; email: string; password: string }>;
    sampleData?: Record<string, any>;
  };
  confidenceThreshold?: number;
  updatedBy?: string;
}

export interface AssignmentFilterDTO {
  batch?: number;
  assignmentNo?: number;
  status?: string;
}

// ─── Validator ───────────────────────────────────────────────────────────────

export function validateRequirements(reqs: Record<string, any>): void {
  if (!reqs || typeof reqs !== "object" || Array.isArray(reqs)) {
    throw new Error("requirements must be a valid JSON object");
  }

  for (const [section, requirements] of Object.entries(reqs)) {
    if (typeof requirements !== "object" || Array.isArray(requirements)) {
      throw new Error(`Section "${section}" must be an object`);
    }

    for (const [reqKey, req] of Object.entries(
      requirements as Record<string, any>,
    )) {
      // Skip sub_req keys — they follow the same shape but are nested
      if (reqKey.startsWith("sub_req")) continue;

      const r = req as any;

      if (!r.description || typeof r.description !== "string") {
        throw new Error(
          `${section}.${reqKey} — "description" is required and must be a string`,
        );
      }
      if (r.number === undefined || r.number === null) {
        throw new Error(`${section}.${reqKey} — "number" (marks) is required`);
      }
      if (r.correct === undefined) {
        throw new Error(
          `${section}.${reqKey} — "correct" (boolean) is required`,
        );
      }
      if (!r.message || typeof r.message !== "string") {
        throw new Error(
          `${section}.${reqKey} — "message" is required and must be a string`,
        );
      }
    }
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

// Create a new assignment
const createAssignment = async (data: CreateAssignmentDTO) => {
  validateRequirements(data.originalRequirements);

  const assignment = await Assignment.create({
    assignmentNo: data.assignmentNo,
    batch: data.batch,
    title: data.title,
    figmaUrl: data.figmaUrl,
    originalRequirements: data.originalRequirements,
    dbSeedConfig: data.dbSeedConfig,
    confidenceThreshold: data.confidenceThreshold ?? 0.75,
    status: "draft",
    version: 1,
  });

  // Trigger Gemini enrichment in background — non-blocking

  import("./enrichment.service").then(({ enrichAssignment }) => {
    enrichAssignment(assignment._id.toString())
      .then(() => console.log(`Enrichment done: ${assignment._id}`))
      .catch((err) =>
        console.error("Background enrichment error:", err.message),
      );
  });

  return assignment;
};

// Get all assignments with optional filters
const getAllAssignments = async (filters: AssignmentFilterDTO) => {
  const query: Record<string, any> = {};

  if (filters.batch !== undefined) query.batch = filters.batch;
  if (filters.assignmentNo !== undefined)
    query.assignmentNo = filters.assignmentNo;
  if (filters.status) query.status = filters.status;

  const assignments = await Assignment.find(query)
    .select("-enrichedRequirements") // exclude heavy field from list view
    .sort({ batch: -1, assignmentNo: 1 });

  return assignments;
};

// Get single assignment by MongoDB ObjectId
const getById = async (id: string) => {
  const assignment = await Assignment.findById(id);
  return assignment;
};

// Get by batch + assignmentNo — instructor's natural query
const getByBatchAndNo = async (batch: number, assignmentNo: number) => {
  const assignment = await Assignment.findOne({ batch, assignmentNo });
  return assignment;
};
// Update assignment — instructor edits JSON
// Clears enrichedRequirements and bumps version
const update = async (id: string, data: UpdateAssignmentDTO) => {
  const assignment = await Assignment.findById(id);

  if (!assignment) return null;

  // If requirements are being updated — validate and clear enrichment
  if (data.originalRequirements) {
    validateRequirements(data.originalRequirements);
    assignment.originalRequirements = data.originalRequirements;
    assignment.enrichedRequirements = undefined;
    assignment.status = "draft"; // re-draft until re-enriched
  }

  if (data.title !== undefined) assignment.title = data.title;
  if (data.figmaUrl !== undefined) assignment.figmaUrl = data.figmaUrl;
  if (data.dbSeedConfig !== undefined)
    assignment.dbSeedConfig = data.dbSeedConfig;
  if (data.confidenceThreshold !== undefined)
    assignment.confidenceThreshold = data.confidenceThreshold;

  // Bump version and track who updated
  assignment.version += 1;
  assignment.lastUpdatedBy = data.updatedBy ?? "instructor";

  await assignment.save();
  return assignment;
};

// Activate assignment — instructor confirms after preview
const activate = async (id: string) => {
  const assignment = await Assignment.findByIdAndUpdate(
    id,
    { status: "active" },
    { returnDocument: "after" },
  );
  return assignment;
};

// Archive assignment
const archive = async (id: string) => {
  const assignment = await Assignment.findByIdAndUpdate(
    id,
    { status: "archived" },
    { returnDocument: "after" },
  );
  return assignment;
};

// Save enriched requirements from AI Intent Parser (Day 3)
const saveEnriched = async (
  id: string,
  enrichedRequirements: Record<string, any>,
) => {
  const assignment = await Assignment.findByIdAndUpdate(
    id,
    {
      enrichedRequirements,
      status: "active",
    },
    { returnDocument: "after" },
  );
  return assignment;
};

// Get enriched requirements — used by checker worker
const getEnrichedRequirements = async (id: string) => {
  const assignment = await Assignment.findById(id).select(
    "enrichedRequirements originalRequirements status confidenceThreshold",
  );
  return assignment;
};

// Lightweight enrichment status — frontend polls this to know when
// enrichment has completed without pulling the heavy enriched payload.
const getEnrichmentStatus = async (id: string) => {
  const assignment = await Assignment.findById(id).select(
    "status enrichedRequirements version",
  );
  if (!assignment) return null;

  return {
    enrichmentComplete: !!assignment.enrichedRequirements,
    status: assignment.status,
    version: assignment.version,
  };
};

export const AssignmentService = {
  create: createAssignment,
  getAll: getAllAssignments,
  getById: getById,
  getByBatchAndNo: getByBatchAndNo,
  update: update,
  activate: activate,
  archive: archive,
  saveEnriched: saveEnriched,
  getEnrichedRequirements: getEnrichedRequirements,
  getEnrichmentStatus: getEnrichmentStatus,
};
