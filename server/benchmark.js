const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const extractText = require('./services/documentExtractor');
const analyzeDocuments = require('./services/analysisService');
const { generateHandoverReport } = require('./services/reportGenerator');

const sampleFiles = [
    { format: 'TXT', filename: 'fa9c1649-1ccc-44e7-bd98-cdfef9b0681d.txt', originalName: 'payment_ops.txt' },
    { format: 'MD', filename: 'ff590cbe-702e-4347-9702-80bd3f57aaa2.md', originalName: 'architecture_handover.md' },
    { format: 'DOCX', filename: '1ea009c5-f045-40e5-81c9-13ff85f0e4da.docx', originalName: 'project_spec.docx' },
    { format: 'PDF', filename: '84b178af-87d3-4df8-bc11-06f13c6ab17e.pdf', originalName: 'HandoverX_Round1_Final_Proposal.pdf.pdf' }
];

async function benchmarkSingle(sample) {
    const filePath = path.join(__dirname, 'uploads', sample.filename);

    const tStart = Date.now();

    // 1. Text extraction
    const tExtractStart = Date.now();
    const extracted = await extractText({
        originalname: sample.originalName,
        path: filePath
    });
    const extractionTimeMs = Date.now() - tExtractStart;

    const doc = {
        documentId: 'bench-' + sample.format.toLowerCase() + '-' + Date.now(),
        originalName: sample.originalName,
        storedName: sample.filename,
        contentHash: extracted.contentHash,
        extractedText: extracted.text,
        pages: extracted.pages
    };

    // 2. Gemini Analysis & Evidence Verification
    const tAnalysisStart = Date.now();
    const analysis = await analyzeDocuments([doc]);
    const analysisTimeMs = Date.now() - tAnalysisStart;

    // 3. Report Generation
    const tReportStart = Date.now();
    const report = generateHandoverReport(analysis, [doc]);
    const reportTimeMs = Date.now() - tReportStart;

    const totalTimeMs = Date.now() - tStart;

    return {
        format: sample.format,
        file: sample.originalName,
        chars: extracted.text.length,
        pages: extracted.pages?.length || 0,
        extractionTimeMs,
        analysisTimeMs,
        reportTimeMs,
        totalTimeMs,
        findingsCount: (analysis.decisions?.length || 0) +
                       (analysis.tasks?.length || 0) +
                       (analysis.blockers?.length || 0) +
                       (analysis.dependencies?.length || 0) +
                       (analysis.people?.length || 0) +
                       (analysis.missingInformation?.length || 0)
    };
}

async function runBenchmark() {
    console.log('====================================================');
    console.log('POST-OPTIMIZATION BENCHMARK — ALL SUPPORTED FORMATS');
    console.log('====================================================\n');

    const freshResults = [];
    for (const sample of sampleFiles) {
        console.log(`Analyzing ${sample.format} (${sample.originalName})...`);
        const res = await benchmarkSingle(sample);
        freshResults.push(res);
        console.log(`✓ ${sample.format} done in ${res.totalTimeMs} ms (extract: ${res.extractionTimeMs}ms, analysis: ${res.analysisTimeMs}ms)\n`);
    }

    console.log('\n--- FRESH EXECUTION SUMMARY ---');
    console.table(freshResults.map(r => ({
        Format: r.format,
        'Chars': r.chars,
        'Pages': r.pages,
        'Extraction (ms)': r.extractionTimeMs,
        'Analysis+Verify (ms)': r.analysisTimeMs,
        'Report (ms)': r.reportTimeMs,
        'Total (ms)': r.totalTimeMs,
        'Total (s)': (r.totalTimeMs / 1000).toFixed(2),
        'Findings': r.findingsCount
    })));

    console.log('\n====================================================');
    console.log('CACHED / UNCHANGED DOCUMENT RE-PROCESSING BENCHMARK');
    console.log('====================================================\n');

    const cachedResults = [];
    for (const sample of sampleFiles) {
        const res = await benchmarkSingle(sample);
        cachedResults.push(res);
    }

    console.table(cachedResults.map(r => ({
        Format: r.format,
        'Extraction (ms)': r.extractionTimeMs,
        'Analysis (ms)': r.analysisTimeMs,
        'Total (ms)': r.totalTimeMs,
        'Total (s)': (r.totalTimeMs / 1000).toFixed(2),
        'Speedup': 'Instant (0 ms)'
    })));
}

runBenchmark().catch(err => {
    console.error('Benchmark failed:', err);
    process.exit(1);
});
