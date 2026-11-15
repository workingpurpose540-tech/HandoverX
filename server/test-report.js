
const path = require('path');
const extractText = require('./services/documentExtractor');
const analyzeDocuments = require('./services/analysisService');
const { generateHandoverReport } = require('./services/reportGenerator');

async function main() {
    const originalName = 'HandoverX_Round1_Final_Proposal.pdf.pdf';
    const storedName = '84b178af-87d3-4df8-bc11-06f13c6ab17e.pdf';

    const filePath = path.join(__dirname, 'uploads', storedName);

    const extracted = await extractText({
        originalname: originalName,
        path: filePath
    });

    const document = {
        documentId: '663de8c8-f216-494b-adfb-216de7664783',
        originalName,
        storedName,
        extractedText: extracted.text,
        pages: extracted.pages
    };

    console.log('Starting PDF analysis...');

    const analysis = await analyzeDocuments([document]);

    console.log('Generating handover report...');

    const report = generateHandoverReport(analysis);

    console.log('\n========== HANDOVER REPORT ==========\n');
    console.log(report);

    console.log('\n========== REPORT SUMMARY ==========');
    console.log('Project:', analysis.projectName);
    console.log('Decisions:', analysis.decisions.length);
    console.log('Tasks:', analysis.tasks.length);
    console.log('Blockers:', analysis.blockers.length);
    console.log('Dependencies:', analysis.dependencies.length);
    console.log('People:', analysis.people.length);
    console.log('Missing information:', analysis.missingInformation.length);
}

main().catch(error => {
    console.error('Report generation failed:', error);
});
