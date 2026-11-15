
require('dotenv').config();

const crypto = require('crypto');
const { generateWithRetry } = require('./geminiClient');
const { analysisSchema } = require('../validators/analysisSchema');
const { verifyAnalysisEvidence } = require('./evidenceverifier');
const createLocalFallback = require('./localFallback');

// In-memory cache and in-flight deduplication for analyses
const analysisCache = new Map();
const activeAnalyses = new Map();

function computeBatchHash(documents) {
    const tokens = documents.map((doc) => {
        return `${doc.contentHash || doc.originalName || ''}:${(doc.extractedText || '').length}`;
    }).sort().join('|');

    return crypto.createHash('sha256').update(tokens).digest('hex');
}

function mapCachedAnalysisToDocuments(cachedAnalysis, documents) {
    const cloned = JSON.parse(JSON.stringify(cachedAnalysis));
    const nameToId = new Map();
    for (const doc of documents) {
        nameToId.set(doc.originalName, doc.documentId);
        if (doc.storedName) nameToId.set(doc.storedName, doc.documentId);
    }
    const categories = [
        'decisions',
        'tasks',
        'blockers',
        'dependencies',
        'people',
        'missingInformation'
    ];
    for (const cat of categories) {
        for (const finding of (cloned[cat] || [])) {
            for (const ev of (finding.evidence || [])) {
                if (nameToId.has(ev.sourceFile)) {
                    ev.documentId = nameToId.get(ev.sourceFile);
                }
            }
            for (const ev of (finding.verifiedEvidence || [])) {
                if (nameToId.has(ev.sourceFile)) {
                    ev.documentId = nameToId.get(ev.sourceFile);
                }
            }
        }
    }
    if (Array.isArray(cloned.conflicts)) {
        for (const conflict of cloned.conflicts) {
            for (const claim of (conflict.claims || [])) {
                if (nameToId.has(claim.sourceFile)) {
                    claim.documentId = nameToId.get(claim.sourceFile);
                }
            }
        }
    }
    return cloned;
}

async function analyzeDocuments(documents) {
    if (!documents || documents.length === 0) {
        throw new Error('No documents provided for analysis.');
    }

    const batchKey = computeBatchHash(documents);

    // Return cached analysis if unchanged documents are re-evaluated
    if (analysisCache.has(batchKey)) {
        return mapCachedAnalysisToDocuments(analysisCache.get(batchKey), documents);
    }

    // Deduplicate in-flight analysis requests for the same document batch
    if (activeAnalyses.has(batchKey)) {
        return activeAnalyses.get(batchKey);
    }

    const analysisPromise = (async () => {
        const documentContext = documents.map((doc) => {
            let content = doc.extractedText || '';
            if (doc.pages && doc.pages.length > 0) {
                content = doc.pages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join('\n\n');
            }
            return `DOCUMENT ID: ${doc.documentId}\nFILENAME: ${doc.originalName}\n\nDOCUMENT CONTENT:\n${content}`;
        }).join('\n\n====================\n\n');

        const prompt = `You are HandoverX, an expert project handover analyst.
Analyze the uploaded project documents and return ONLY valid JSON.

Use this exact structure:
{
  "projectName": "Descriptive project name (use HandoverX as the platform name, never ContinuumAI)",
  "projectSummary": "Clear executive summary of current project status and context",
  "decisions": [],
  "tasks": [],
  "blockers": [],
  "dependencies": [],
  "people": [],
  "missingInformation": [],
  "conflicts": []
}

Each finding MUST contain:
{
  "id": "unique-id",
  "title": "Short descriptive title (never omit or rename)",
  "description": "Clear explanation",
  "evidenceStatus": "inferred-needs-confirmation",
  "evidence": [
    {
      "documentId": "exact document ID",
      "sourceFile": "exact original filename",
      "quote": "Exact quote copied verbatim from the document text",
      "pageNumber": 1,
      "section": null
    }
  ]
}

Each conflict in "conflicts" (if any) MUST follow this structure:
{
  "id": "conflict-unique-id",
  "title": "Short title describing the contradiction",
  "description": "Clear explanation of how the documents contradict each other",
  "resolutionStatus": "unresolved",
  "claims": [
    {
      "claim": "Claim stated in Document A",
      "sourceFile": "exact original filename of Document A",
      "documentId": "exact document ID of Document A",
      "quote": "Exact quote copied verbatim from Document A",
      "pageNumber": 1
    },
    {
      "claim": "Directly contradictory claim in Document B",
      "sourceFile": "exact original filename of Document B",
      "documentId": "exact document ID of Document B",
      "quote": "Exact quote copied verbatim from Document B",
      "pageNumber": null
    }
  ]
}

RULES:
1. Product Name: HandoverX is the product name. Never use ContinuumAI.
2. Groundedness: Never invent project details, dates, people, or sources.
3. Status: Distinguish historical proposal plans from current status; do not present completed work as pending.
4. Quotations: Copy evidence quotes verbatim. Do not fabricate or alter quotes.
5. Attribution: Use the exact document ID and filename provided.
6. Page numbers: For PDFs, cite the exact integer page number from the '--- PAGE X ---' headers where the quote appears. For TXT, MD, and DOCX, set pageNumber to null.
7. People: Only include people explicitly named in the documents. Never output placeholders like '[YOUR NAME]'.
8. Missing Information: Clearly identify missing technical information or architecture gaps.
9. Empty categories: If a category has no findings, provide an empty array [].
10. Valid JSON: Return strictly raw JSON. Do not include markdown code fences or conversational text.
11. Cross-Document Conflicts:
- Compare information across all uploaded documents.
- If two or more documents make directly contradictory statements on the same decision, task, timeline, dependency, or architecture (e.g. Document A says architecture is polling while Document B says architecture migrated to message queue; or Document A says deadline is Nov 10 while Document B says deadline is Dec 1), include a conflict in "conflicts".
- Every conflict MUST cite at least 2 distinct uploaded documents in "claims".
- Never classify slight differences in wording, complementary details, or normal sequential project steps as conflicts.
- If there is only 1 document, or if no contradictory claims exist across documents, return "conflicts": [].

UPLOADED DOCUMENTS:
${documentContext}`;

        try {
            const response = await generateWithRetry(prompt);
            const rawText = response.text;

            if (!rawText) {
                throw new Error('Gemini returned an empty response.');
            }

            // Strip any accidental markdown formatting or code blocks if returned
            const sanitizedText = rawText
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/, '')
                .replace(/\s*```$/, '')
                .trim();

            let parsedAnalysis;
            try {
                parsedAnalysis = JSON.parse(sanitizedText);
            } catch {
                throw new Error('Gemini returned invalid JSON.');
            }

            // Clean product name if legacy source documents contained ContinuumAI
            if (parsedAnalysis.projectName && parsedAnalysis.projectName.includes('ContinuumAI')) {
                parsedAnalysis.projectName = parsedAnalysis.projectName.replace(/ContinuumAI/g, 'HandoverX');
            }

            const categories = [
                'decisions',
                'tasks',
                'blockers',
                'dependencies',
                'people',
                'missingInformation'
            ];

            for (const category of categories) {
                parsedAnalysis[category] = (parsedAnalysis[category] || [])
                    .filter((finding) => {
                        // Filter out unresolved placeholders like [YOUR NAME] in people
                        if (category === 'people') {
                            const title = (finding.title || '').trim();
                            if (title.includes('[YOUR NAME]') || title.toLowerCase().includes('placeholder')) {
                                return false;
                            }
                        }
                        return true;
                    })
                    .map((finding) => ({
                        ...finding,
                        evidenceStatus: 'inferred-needs-confirmation'
                    }));
            }

            // Cross-document conflicts post-processing
            if (!Array.isArray(documents) || documents.length < 2) {
                parsedAnalysis.conflicts = [];
            } else {
                parsedAnalysis.conflicts = (parsedAnalysis.conflicts || [])
                    .filter((c) => {
                        if (!c.claims || c.claims.length < 2) return false;
                        const distinctFiles = new Set(
                            c.claims.map((cl) => (cl.sourceFile || '').toLowerCase().trim())
                        );
                        return distinctFiles.size >= 2;
                    })
                    .map((c, idx) => ({
                        id: c.id || `conflict-${idx + 1}`,
                        title: c.title || 'Cross-Document Contradiction',
                        description: c.description || 'Contradictory information identified between documents.',
                        resolutionStatus: 'unresolved',
                        claims: (c.claims || []).map((cl) => ({
                            claim: cl.claim || '',
                            sourceFile: cl.sourceFile || '',
                            documentId: cl.documentId || '',
                            quote: cl.quote || '',
                            pageNumber: Number.isInteger(cl.pageNumber) ? cl.pageNumber : null,
                            evidenceStatus: 'inferred-needs-confirmation'
                        }))
                    }));
            }

            const validatedAnalysis = analysisSchema.parse(parsedAnalysis);
            const finalAnalysis = verifyAnalysisEvidence(validatedAnalysis, documents);

            // Cache successful analysis
            analysisCache.set(batchKey, finalAnalysis);

            return finalAnalysis;

        } catch (error) {
            console.error('Gemini analysis failed. Using local fallback:', error.message);
            return createLocalFallback(documents);
        } finally {
            activeAnalyses.delete(batchKey);
        }
    })();

    activeAnalyses.set(batchKey, analysisPromise);
    return analysisPromise;
}

module.exports = analyzeDocuments;

