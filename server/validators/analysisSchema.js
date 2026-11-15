
const { z } = require('zod');

// Allowed evidence verification statuses
const evidenceStatusSchema = z.enum([
    'source-supported',
    'inferred-needs-confirmation',
    'evidence-missing'
]);

// Reference to the original uploaded document
const evidenceSchema = z.object({
    documentId: z.string().min(1),
    sourceFile: z.string().min(1),
    quote: z.string().default(''),
    pageNumber: z.number().int().positive().nullable().optional(),
    section: z.string().nullable().optional()
});

// Common structure for project findings
const findingSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    evidenceStatus: evidenceStatusSchema,
    evidence: z.array(evidenceSchema).default([])
});

// Conflicting claim in a cross-document contradiction
const conflictClaimSchema = z.object({
    claim: z.string().min(1),
    sourceFile: z.string().min(1),
    documentId: z.string().default(''),
    quote: z.string().default(''),
    pageNumber: z.number().int().positive().nullable().optional(),
    evidenceStatus: evidenceStatusSchema.optional().default('inferred-needs-confirmation'),
    verified: z.boolean().optional(),
    verificationReason: z.string().optional()
});

// Cross-document conflict structure
const conflictSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    resolutionStatus: z.enum(['unresolved', 'resolved', 'dismissed']).default('unresolved'),
    claims: z.array(conflictClaimSchema).min(2),
    review: z.any().optional(),
    reviewStatus: z.string().optional()
});

// Main project analysis structure
const analysisSchema = z.object({
    projectName: z.string().min(1),
    projectSummary: z.string(),

    decisions: z.array(findingSchema).default([]),
    tasks: z.array(findingSchema).default([]),
    blockers: z.array(findingSchema).default([]),
    dependencies: z.array(findingSchema).default([]),
    people: z.array(findingSchema).default([]),
    missingInformation: z.array(findingSchema).default([]),
    conflicts: z.array(conflictSchema).default([])
});

module.exports = {
    analysisSchema,
    evidenceSchema,
    findingSchema,
    conflictClaimSchema,
    conflictSchema,
    evidenceStatusSchema
};
