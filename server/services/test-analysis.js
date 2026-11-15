require('dotenv').config();

const analyzeDocuments = require('./analysisService');

const documents = [
    {
        documentId: 'doc-001',
        originalName: 'project-notes.txt',
        storedName: 'project-notes.txt',
        extractedText: `
            Project: HandoverX

            The frontend will be developed using React.
            The backend will use Node.js and Express.
            The team needs to complete user authentication.
            Firebase will be used for authentication and database storage.
        `
    }
];

async function testAnalysis() {
    try {
        console.log('Starting document analysis...');

        const result = await analyzeDocuments(documents);

        console.log('\nAnalysis completed successfully!');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

testAnalysis();