
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');

const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');
const upload = require('../middleware/upload');
const extractText = require('../services/documentExtractor');
const analyzeDocuments = require('../services/analysisService');
const { generateHandoverReport } = require('../services/reportGenerator');

const {
    verifyProjectAccess,
    saveProjectHandover
} = require('../services/projectService');

const router = express.Router();

router.post('/', verifyFirebaseToken, (req, res) => {
    upload.array('documents', 10)(req, res, async (error) => {
        const files = req.files || [];

        const cleanupFiles = () => {
            files.forEach((file) => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        };

        if (error) {
            cleanupFiles();

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        try {
            const { projectId } = req.body;

            if (!projectId) {
                cleanupFiles();

                return res.status(400).json({
                    success: false,
                    message: 'Project ID is required.'
                });
            }

            if (files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please upload at least one document.'
                });
            }

            // STEP 1: Verify project access
            try {
                await verifyProjectAccess(projectId, req.user.uid);
            } catch (error) {
                cleanupFiles();

                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }

            // STEP 2: Extract document text
            const documents = await Promise.all(
                files.map(async (file) => {
                    const extracted = await extractText(file);

                    return {
                        documentId: crypto.randomUUID(),
                        originalName: file.originalname,
                        storedName: file.filename,
                        format: file.originalname.split('.').pop().toLowerCase(),
                        size: file.size,
                        extractedText: extracted.text,
                        pages: extracted.pages
                    };
                })
            );

            // STEP 3: Analyse documents using Gemini
            const analysis = await analyzeDocuments(documents);

            // STEP 4: Generate handover report
            const report = generateHandoverReport(analysis, documents);

            // STEP 5: Save results in the project
            const saved = await saveProjectHandover(
                projectId,
                req.user,
                documents,
                analysis,
                report
            );

            return res.status(200).json({
                success: true,
                message: 'Project documents analysed and saved successfully.',
                projectId,
                totalDocuments: documents.length,
                saved,
                documents: documents.map((doc) => {
                    const text = typeof doc.extractedText === 'string' ? doc.extractedText : '';
                    return {
                        documentId: doc.documentId,
                        originalName: doc.originalName,
                        format: doc.format,
                        size: doc.size,
                        pageCount: doc.pages.length,
                        extractedTextPreview: text.length > 0 ? text.slice(0, 10000) : null
                    };
                }),
                analysis,
                report
            });

        } catch (err) {
            console.error('HandoverX upload error:', err);

            cleanupFiles();

            return res.status(500).json({
                success: false,
                message: err.message || 'Document processing failed.'
            });
        }
    });
});

module.exports = router;
