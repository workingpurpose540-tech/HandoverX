const crypto = require('crypto');

function createLocalFallback(documents) {
    const documentFindings = documents.map((doc) => ({
        id: crypto.randomUUID(),
        title: `Uploaded document: ${doc.originalName}`,
        description: `Text extraction completed. ${(doc.extractedText || '').length} characters extracted. Manual review is pending.`,
        evidenceStatus: 'evidence-missing',
        evidence: []
    }));

    return {
        projectName: 'Project name needs confirmation',
        projectSummary: 'Gemini analysis was unavailable. Documents were uploaded and extracted, but their contents have not been analysed.',
        decisions: [],
        tasks: [],
        blockers: [],
        dependencies: [],
        people: [],
        missingInformation: [
            {
                id: crypto.randomUUID(),
                title: 'AI analysis pending',
                description: 'Review the uploaded documents to identify project decisions, tasks, blockers and responsibilities.',
                evidenceStatus: 'evidence-missing',
                evidence: []
            },
            ...documentFindings
        ],
        conflicts: [],
        analysisMode: 'local-fallback',
        warning: 'Gemini was unavailable. No AI-generated findings are included.'
    };
}

module.exports = createLocalFallback;