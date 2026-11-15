
const { verifyAnalysisEvidence } = require('./services/evidenceverifier');

// Sample uploaded document
const documents = [
    {
        documentId: 'doc-001',
        originalName: 'project-notes.txt',
        storedName: 'stored-file.txt',
        extractedText: `
            The frontend will be developed using React.
            The backend will use Node.js and Express.
        `
    }
];

// Sample project analysis with three test cases
const analysis = {
    projectName: 'HandoverX',
    projectSummary: 'A project handover platform.',

    decisions: [
        {
            id: 'decision-001',
            title: 'Use React',
            description: 'React will power the frontend.',
            evidence: [
                {
                    documentId: 'doc-001',
                    sourceFile: 'project-notes.txt',
                    quote: 'The frontend will be developed using React.'
                }
            ]
        },
        {
            id: 'decision-002',
            title: 'Use MongoDB',
            description: 'The project uses MongoDB.',
            evidence: [
                {
                    documentId: 'doc-001',
                    sourceFile: 'project-notes.txt',
                    quote: 'The project uses MongoDB.'
                }
            ]
        },
        {
            id: 'decision-003',
            title: 'Use Docker',
            description: 'The project uses Docker.',
            evidence: []
        }
    ],

    tasks: [],
    blockers: [],
    dependencies: [],
    people: [],
    missingInformation: []
};

// Run evidence verification
const result = verifyAnalysisEvidence(analysis, documents);

// Display the complete result
console.log(JSON.stringify(result, null, 2));

// Display a simple verification summary
console.log('\n--- EVIDENCE TEST SUMMARY ---');

result.decisions.forEach((decision) => {
    console.log(
        `${decision.title}: ${decision.evidenceStatus}`
    );
});

