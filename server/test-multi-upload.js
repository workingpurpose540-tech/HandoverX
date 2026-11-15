const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const extractText = require('./services/documentExtractor');
const analyzeDocuments = require('./services/analysisService');
const { generateHandoverReport } = require('./services/reportGenerator');

async function testMultiDoc() {
    console.log('Testing Multi-Document Analysis...');

    const files = [
        { filename: 'fa9c1649-1ccc-44e7-bd98-cdfef9b0681d.txt', originalName: 'ops_alerts.txt' },
        { filename: 'ff590cbe-702e-4347-9702-80bd3f57aaa2.md', originalName: 'architecture_guide.md' }
    ];

    const docs = await Promise.all(files.map(async (f, idx) => {
        const filePath = path.join(__dirname, 'uploads', f.filename);
        const extracted = await extractText({ originalname: f.originalName, path: filePath });
        return {
            documentId: 'doc-multi-' + idx,
            originalName: f.originalName,
            storedName: f.filename,
            contentHash: extracted.contentHash,
            extractedText: extracted.text,
            pages: extracted.pages
        };
    }));

    console.log(`Extracted ${docs.length} documents.`);
    const analysis = await analyzeDocuments(docs);

    console.log('Project Name:', analysis.projectName);
    console.log('Summary length:', analysis.projectSummary?.length);
    console.log('Decisions:', analysis.decisions?.length);
    console.log('Tasks:', analysis.tasks?.length);
    console.log('Blockers:', analysis.blockers?.length);
    console.log('Dependencies:', analysis.dependencies?.length);
    console.log('People:', analysis.people?.length);
    console.log('Missing Info:', analysis.missingInformation?.length);

    // Verify report generation
    const report = generateHandoverReport(analysis, docs);
    console.log('\nReport Length:', report.length);

    // Verify no ContinuumAI
    if (report.includes('ContinuumAI')) {
        throw new Error('Report contains legacy ContinuumAI text!');
    }
    // Verify no [YOUR NAME]
    if (report.includes('[YOUR NAME]')) {
        throw new Error('Report contains unresolved [YOUR NAME] placeholder!');
    }
    // Verify no escaped markdown like \## or \**
    if (report.includes('\\##') || report.includes('\\**')) {
        throw new Error('Report contains escaped markdown!');
    }
    // Verify no &#x20;
    if (report.includes('&#x20;')) {
        throw new Error('Report contains raw HTML entities!');
    }

    console.log('\n✓ Multi-document analysis and report generation PASSED all quality checks!');
}

testMultiDoc().catch(err => {
    console.error('Multi-doc test failed:', err);
    process.exit(1);
});

