import { Assignment } from "./assignment.model";
import { enrichAssignmentRequirements } from "../../checker/ai/intentParser";

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

  let mainTotal = 0;
  let challengeTotal = 0;

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
      if (r.message === undefined || r.message === null || typeof r.message !== "string") {
        throw new Error(
          `${section}.${reqKey} — "message" is required and must be a string (can be empty)`,
        );
      }

      const weight = Number(r.number || 0);
      if (section.toLowerCase().includes('challenge') || reqKey.toLowerCase().includes('challenge')) {
        challengeTotal += weight;
      } else {
        mainTotal += weight;
      }
    }
  }

  if (mainTotal !== 50) {
    throw new Error(`Main requirements total must be exactly 50 marks (current: ${mainTotal})`);
  }
  if (challengeTotal !== 10) {
    throw new Error(`Challenge requirements total must be exactly 10 marks (current: ${challengeTotal})`);
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

// Create or update a new assignment (upsert)
const createAssignment = async (data: CreateAssignmentDTO) => {
  // Handle new template format: { assignmentMeta, figmaUrl, requirements }
  // In case the client sends the raw template JSON instead of the flat format
  const rawData = data as any;
  if (rawData.assignmentMeta && rawData.requirements && !data.originalRequirements) {
    const meta = rawData.assignmentMeta;
    let assignmentNo = meta.assignmentNo || meta.number;
    if (!assignmentNo && meta.title) {
      const match = meta.title.match(/Assignment\s+(\d+)/i);
      if (match) assignmentNo = parseInt(match[1], 10);
    }
    data = {
      ...data,
      assignmentNo: assignmentNo || data.assignmentNo,
      batch: meta.batch || data.batch,
      title: meta.title || data.title,
      figmaUrl: rawData.figmaUrl || data.figmaUrl,
      originalRequirements: rawData.requirements,
    };
  }

  validateRequirements(data.originalRequirements);


  // Check if original requirements are pre-enriched
  const firstSection = Object.values(data.originalRequirements)[0];
  const firstReq = firstSection ? Object.values(firstSection)[0] : null;
  const isPreEnriched = firstReq && (firstReq as any).automationTier !== undefined;

  const assignment = await Assignment.findOneAndUpdate(
    { assignmentNo: data.assignmentNo, batch: data.batch },
    {
      assignmentNo: data.assignmentNo,
      batch: data.batch,
      title: data.title,
      figmaUrl: data.figmaUrl,
      originalRequirements: data.originalRequirements,
      enrichedRequirements: isPreEnriched ? data.originalRequirements : undefined,
      dbSeedConfig: data.dbSeedConfig,
      confidenceThreshold: data.confidenceThreshold ?? 0.75,
      status: isPreEnriched ? "active" : "draft",
      $inc: { version: 1 }
    },
    { new: true, upsert: true }
  );

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

  // If requirements are being updated — validate and clear/copy enrichment
  if (data.originalRequirements) {
    validateRequirements(data.originalRequirements);
    assignment.originalRequirements = data.originalRequirements;

    // Check if new requirements are pre-enriched
    const firstSection = Object.values(data.originalRequirements)[0];
    const firstReq = firstSection ? Object.values(firstSection)[0] : null;
    const isPreEnriched = firstReq && (firstReq as any).automationTier !== undefined;

    if (isPreEnriched) {
      assignment.enrichedRequirements = data.originalRequirements;
      assignment.status = "active";
    } else {
      assignment.enrichedRequirements = undefined;
      assignment.status = "draft"; // re-draft until re-enriched
    }
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
    { new: true },
  );
  return assignment;
};

// Archive assignment
const archive = async (id: string) => {
  const assignment = await Assignment.findByIdAndUpdate(
    id,
    { status: "archived" },
    { new: true },
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
    { new: true },
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

// Delete assignment
const deleteAssignment = async (id: string) => {
  return Assignment.findByIdAndDelete(id);
};

// Force re-run of AI enrichment, clearing the previous enrichedRequirements
const reEnrich = async (id: string) => {
  const assignment = await Assignment.findById(id);
  if (!assignment) throw new Error("Assignment not found");

  // Clear old enriched requirements so the checker doesn't use stale rules
  await Assignment.findByIdAndUpdate(id, { $unset: { enrichedRequirements: 1 } });

  const source = assignment.originalRequirements;
  if (!source || Object.keys(source).length === 0) {
    throw new Error("Assignment has no originalRequirements to enrich");
  }

  const enriched = await enrichAssignmentRequirements(source);

  const updated = await Assignment.findByIdAndUpdate(
    id,
    { enrichedRequirements: enriched, status: "active" },
    { new: true }
  );
  if (!updated) throw new Error("Failed to save enriched requirements");
  return updated;
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
  reEnrich: reEnrich,
  delete: deleteAssignment,
};
