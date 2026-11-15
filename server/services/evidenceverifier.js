
function normalizeText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function verifyEvidence(evidence, docMap) {
    if (!evidence || evidence.length === 0) {
        return {
            evidenceStatus: 'evidence-missing',
            verificationReason: 'No evidence was provided.',
            verifiedEvidence: []
        };
    }

    const verifiedEvidence = evidence.map((item) => {
        const document = docMap.get(item.documentId);

        if (!document) {
            return {
                ...item,
                verified: false,
                reason: 'Referenced document was not found.'
            };
        }

        const correctFile =
            item.sourceFile === document.originalName ||
            item.sourceFile === document.storedName;

        if (!correctFile) {
            return {
                ...item,
                verified: false,
                reason: 'Source filename does not match the uploaded document.'
            };
        }

        const quote = normalizeText(item.quote);

        if (!quote) {
            return {
                ...item,
                verified: false,
                reason: 'Evidence quote is empty.'
            };
        }

        const pages = document.pages || [];

        // PDF: verify the quote on the exact cited page.
        if (pages.length > 0) {
            if (!Number.isInteger(item.pageNumber)) {
                return {
                    ...item,
                    verified: false,
                    reason: 'PDF evidence must include a valid page number.'
                };
            }

            const page = pages.find(
                (p) => p.pageNumber === item.pageNumber
            );

            if (!page) {
                return {
                    ...item,
                    verified: false,
                    reason: 'Referenced PDF page does not exist.'
                };
            }

            if (!page.normalizedText.includes(quote)) {
                return {
                    ...item,
                    verified: false,
                    reason: 'The quoted text was not found on the cited PDF page.'
                };
            }
        } else {
            // TXT, MD, DOCX, or legacy test documents.
            if (!document.normalizedText.includes(quote)) {
                return {
                    ...item,
                    verified: false,
                    reason: 'The quoted text could not be found in the document.'
                };
            }
        }

        return {
            ...item,
            verified: true,
            reason: 'Exact quote found in the referenced source.'
        };
    });

    const allVerified = verifiedEvidence.every(
        (item) => item.verified
    );

    const someVerified = verifiedEvidence.some(
        (item) => item.verified
    );

    if (allVerified) {
        return {
            evidenceStatus: 'source-supported',
            verificationReason: 'All evidence quotes were verified.',
            verifiedEvidence
        };
    }

    if (someVerified) {
        return {
            evidenceStatus: 'inferred-needs-confirmation',
            verificationReason: 'Some evidence quotes were verified, but others need checking.',
            verifiedEvidence
        };
    }

    return {
        evidenceStatus: 'inferred-needs-confirmation',
        verificationReason: 'No evidence quote could be verified.',
        verifiedEvidence
    };
}

function verifyAnalysisEvidence(analysis, documents) {
    const categories = [
        'decisions',
        'tasks',
        'blockers',
        'dependencies',
        'people',
        'missingInformation'
    ];

    // Pre-normalize documents once for O(1) lookups and instant substring searches
    const docMap = new Map();
    for (const doc of documents) {
        const normalizedPages = (doc.pages || []).map((p) => ({
            pageNumber: p.pageNumber,
            text: p.text,
            normalizedText: p.normalizedText || normalizeText(p.text)
        }));

        docMap.set(doc.documentId, {
            ...doc,
            normalizedText: doc.normalizedText || normalizeText(doc.extractedText),
            pages: normalizedPages
        });
    }

    const verifiedAnalysis = { ...analysis };

    for (const category of categories) {
        verifiedAnalysis[category] = (
            analysis[category] || []
        ).map((finding) => {
            const result = verifyEvidence(
                finding.evidence,
                docMap
            );

            return {
                ...finding,
                ...result
            };
        });
    }

    // Verify cross-document conflicts
    if (Array.isArray(analysis.conflicts)) {
        verifiedAnalysis.conflicts = analysis.conflicts
            .filter((conflict) => {
                // RULE 4: Never claim a conflict exists without evidence from at least two distinct documents
                if (!conflict.claims || conflict.claims.length < 2) return false;
                const distinctFiles = new Set(
                    conflict.claims.map((c) => (c.sourceFile || '').toLowerCase().trim())
                );
                return distinctFiles.size >= 2;
            })
            .map((conflict) => {
                const verifiedClaims = conflict.claims.map((claim) => {
                    const result = verifyEvidence(
                        [
                            {
                                documentId: claim.documentId,
                                sourceFile: claim.sourceFile,
                                quote: claim.quote,
                                pageNumber: claim.pageNumber
                            }
                        ],
                        docMap
                    );
                    const verifiedItem = result.verifiedEvidence[0] || {};
                    return {
                        ...claim,
                        evidenceStatus: result.evidenceStatus,
                        verified: Boolean(verifiedItem.verified),
                        verificationReason: verifiedItem.reason || result.verificationReason
                    };
                });

                return {
                    ...conflict,
                    resolutionStatus: conflict.resolutionStatus || 'unresolved',
                    claims: verifiedClaims
                };
            });
    } else {
        verifiedAnalysis.conflicts = [];
    }

    return verifiedAnalysis;
}

module.exports = {
    normalizeText,
    verifyEvidence,
    verifyAnalysisEvidence
};

