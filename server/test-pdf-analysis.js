
const path = require('path');
const extractText = require('./services/documentExtractor');
const analyzeDocuments = require('./services/analysisService');

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

    console.log(`Extracted ${extracted.pages.length} PDF pages.`);
    console.log('Starting Gemini analysis...\n');

    const analysis = await analyzeDocuments([document]);

    console.log('\nANALYSIS MODE:', analysis.analysisMode || 'Gemini');
    console.log('\nPROJECT:', analysis.projectName);

    const categories = [
        'decisions',
        'tasks',
        'blockers',
        'dependencies',
        'people',
        'missingInformation'
    ];

    for (const category of categories) {
        console.log(`\n--- ${category.toUpperCase()} ---`);

        for (const finding of analysis[category] || []) {
            console.log('\nFinding:', finding.title);
            console.log('Status:', finding.evidenceStatus);
            console.log('Reason:', finding.verificationReason);

            for (const evidence of finding.verifiedEvidence || []) {
                console.log('Source:', evidence.sourceFile);
                console.log('Page:', evidence.pageNumber);
                console.log('Verified:', evidence.verified);
                console.log('Reason:', evidence.reason);
                console.log('Quote:', evidence.quote);
            }
        }
    }
}

main().catch(error => {
    console.error('PDF analysis test failed:', error);
});
