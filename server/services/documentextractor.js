
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');

// In-memory cache for extracted document text keyed by content SHA-256
const extractionCache = new Map();

async function extractText(file) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!fs.existsSync(file.path)) {
        throw new Error(`File not found at path: ${file.path}`);
    }

    const fileBuffer = fs.readFileSync(file.path);
    const contentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (extractionCache.has(contentHash)) {
        const cached = extractionCache.get(contentHash);
        return {
            text: cached.text,
            pages: cached.pages.map((p) => ({ ...p })),
            contentHash
        };
    }

    let result;

    if (extension === '.txt' || extension === '.md') {
        const text = fileBuffer.toString('utf8');
        result = { text, pages: [] };
    } else if (extension === '.docx') {
        const docxResult = await mammoth.extractRawText({
            buffer: fileBuffer
        });
        result = { text: docxResult.value, pages: [] };
    } else if (extension === '.pdf') {
        const parser = new PDFParse({
            data: new Uint8Array(fileBuffer)
        });

        try {
            const pdfResult = await parser.getText();
            const pages = pdfResult.pages.map((page, index) => ({
                pageNumber: index + 1,
                text: page.text
            }));

            result = {
                text: pdfResult.text,
                pages
            };
        } finally {
            await parser.destroy();
        }
    } else {
        throw new Error('Unsupported document format.');
    }

    // Cache the extracted result
    extractionCache.set(contentHash, {
        text: result.text,
        pages: result.pages
    });

    return {
        ...result,
        contentHash
    };
}

module.exports = extractText;

