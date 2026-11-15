
function decodeHtmlEntities(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/&#x20;/gi, ' ')
        .replace(/&#32;/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'");
}

function cleanText(str) {
    if (!str || typeof str !== 'string') return '';
    let cleaned = decodeHtmlEntities(str);
    // Strip accidental backslash escapes before markdown markers
    cleaned = cleaned.replace(/\\([#*_`~[\]()>\-+!.])/g, '$1');
    // Normalize excessive horizontal whitespace
    cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();
    // Enforce HandoverX as the product name (never ContinuumAI)
    cleaned = cleaned.replace(/\bContinuumAI\b/g, 'HandoverX');
    return cleaned;
}

function formatSources(verifiedEvidence = []) {
    const validSources = verifiedEvidence.filter((source) => source.quote && source.quote.trim());

    if (validSources.length === 0) {
        return `  - **Source References:** No supporting quotation available in ingested documents.`;
    }

    const lines = validSources.map((source) => {
        const file = cleanText(source.sourceFile || 'Uploaded Document');
        const quote = cleanText(source.quote);
        const pageInfo = Number.isInteger(source.pageNumber) ? ` • Page ${source.pageNumber}` : '';
        const sectionInfo = source.section ? ` • Section: ${cleanText(source.section)}` : '';

        return `  - **Source:** ${file}${pageInfo}${sectionInfo}\n    - **Exact Quote:** "${quote}"`;
    });

    return `  - **Source References:**\n${lines.join('\n')}`;
}

function getEvidenceStatusLabel(status) {
    switch (status) {
        case 'source-supported':
            return 'Source-supported';
        case 'inferred-needs-confirmation':
            return 'Inferred — Needs confirmation';
        case 'evidence-missing':
            return 'Evidence missing';
        default:
            return 'Inferred — Needs confirmation';
    }
}

function getReviewStatusLabel(status) {
    switch (status) {
        case 'approved':
            return 'Approved';
        case 'rejected':
            return 'Rejected';
        case 'changes-requested':
            return 'Changes Requested';
        case 'pending-review':
        default:
            return 'Pending Review';
    }
}

function formatSectionFindings(findings = [], defaultEmptyText = 'No items established from ingested documentation.') {
    if (!findings || findings.length === 0) {
        return `*${defaultEmptyText}*\n`;
    }

    return findings.map((item, index) => {
        const title = cleanText(item.title);
        const description = cleanText(item.description);
        const statusLabel = getEvidenceStatusLabel(item.evidenceStatus);
        const reviewLabel = getReviewStatusLabel(item.reviewStatus);
        const reason = cleanText(item.verificationReason || 'Evaluation completed against source records.');
        const sourcesBlock = formatSources(item.verifiedEvidence || item.evidence);
        const reviewDetail = item.review && item.review.reviewerEmail
            ? `\n- **Human Review:** **${reviewLabel}** (Reviewed by ${cleanText(item.review.reviewerEmail)})${item.review.comment ? `\n- **Reviewer Note:** "${cleanText(item.review.comment)}"` : ''}`
            : `\n- **Human Review:** **${reviewLabel}**`;

        return `### ${index + 1}. ${title}

- **Description:** ${description}
- **Evidence Status:** **${statusLabel}**${reviewDetail}
- **Verification Note:** ${reason}
${sourcesBlock}
`;
    }).join('\n');
}

function generateHandoverReport(analysis, documents = []) {
    const projectName = cleanText(analysis.projectName || 'Project Workspace');
    const projectSummary = cleanText(analysis.projectSummary || 'No executive summary provided in analysis.');

    // Count source documents and verification statistics
    const totalDocs = (documents && documents.length > 0)
        ? documents.length
        : 1;

    const allCategories = [
        ...(analysis.decisions || []),
        ...(analysis.tasks || []),
        ...(analysis.blockers || []),
        ...(analysis.dependencies || []),
        ...(analysis.people || []),
        ...(analysis.missingInformation || [])
    ];

    const sourceSupportedCount = allCategories.filter((f) => f.evidenceStatus === 'source-supported').length;
    const inferredCount = allCategories.filter((f) => f.evidenceStatus === 'inferred-needs-confirmation').length;
    const missingCount = allCategories.filter((f) => f.evidenceStatus === 'evidence-missing').length;

    // Count human review decisions
    const totalFindings = allCategories.length;
    const approvedCount = allCategories.filter((f) => f.reviewStatus === 'approved').length;
    const rejectedCount = allCategories.filter((f) => f.reviewStatus === 'rejected').length;
    const changesRequestedCount = allCategories.filter((f) => f.reviewStatus === 'changes-requested').length;
    const pendingReviewCount = allCategories.filter((f) => !f.reviewStatus || f.reviewStatus === 'pending-review').length;

    let humanReviewStatusLine;
    if (totalFindings === 0) {
        humanReviewStatusLine = 'Review status unavailable — no findings were produced by this analysis.';
    } else if (pendingReviewCount === 0 && approvedCount === totalFindings) {
        humanReviewStatusLine =
            `All ${approvedCount} finding(s) have been verified by human review and marked as Approved.`;
    } else if (approvedCount > 0 || rejectedCount > 0 || changesRequestedCount > 0) {
        humanReviewStatusLine =
            `Human review in progress: ${approvedCount} Approved, ${changesRequestedCount} Changes Requested, ` +
            `${rejectedCount} Rejected, ${pendingReviewCount} Pending Review.`;
    } else {
        humanReviewStatusLine =
            `${pendingReviewCount} finding(s) require human review before sign-off ` +
            `(${inferredCount} Inferred, ${missingCount} Evidence Missing). ` +
            'No findings have been approved by a human reviewer.';
    }

    const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // 1. Report Header
    let report = `# ${projectName} — Technical Handover Report

> **Project Name:** ${projectName}  
> **Generation Date:** ${formattedDate}  
> **Source Documents Analyzed:** ${totalDocs} document(s)  
> **Synthesis Status:** Analysis Complete (${sourceSupportedCount} Source-supported, ${inferredCount} Inferred, ${missingCount} Evidence Missing)

---

## 1. Executive Summary

### 1.1 Project Overview
${projectSummary}

### 1.2 Operational Context
This report was produced by HandoverX using AI-assisted extraction across the uploaded project documents. It organises identified decisions, tasks, blockers, dependencies, and team context into a structured format and links each finding to the nearest available source evidence.

**Limitations to be aware of before relying on this report:**

- **Source scope:** Only the documents uploaded to this project were analysed. Relevant context held elsewhere — in wikis, chat logs, verbal agreements, or systems not represented here — is not reflected.
- **Evidence vs. truth:** A source quotation confirms that the referenced text appears in an uploaded document. It does not confirm that the underlying claim is currently accurate, complete, or still in effect.
- **AI accuracy:** Findings are AI-generated and may contain errors, omissions, or misinterpretations. Inferred findings in particular have not been corroborated by explicit source text.
- **Human review required:** This report must be reviewed and approved by a qualified team member before it is used to make decisions, shared externally, or treated as an authoritative handover record.

---

## 2. Key Decisions
${formatSectionFindings(analysis.decisions, 'No architectural or engineering decisions established in source documents.')}
---

## 3. Pending Tasks
`;

    if (!analysis.tasks || analysis.tasks.length === 0) {
        report += `*No pending tasks established in source documents.*\n\n`;
    } else {
        report += analysis.tasks.map((task, index) => {
            const title = cleanText(task.title);
            const description = cleanText(task.description);
            const statusLabel = getEvidenceStatusLabel(task.evidenceStatus);
            const reviewLabel = getReviewStatusLabel(task.reviewStatus);
            const reason = cleanText(task.verificationReason || 'Evaluation completed against source records.');
            const sourcesBlock = formatSources(task.verifiedEvidence || task.evidence);
            const reviewDetail = task.review && task.review.reviewerEmail
                ? `\n- **Human Review:** **${reviewLabel}** (Reviewed by ${cleanText(task.review.reviewerEmail)})${task.review.comment ? `\n- **Reviewer Note:** "${cleanText(task.review.comment)}"` : ''}`
                : `\n- **Human Review:** **${reviewLabel}**`;

            // Extract responsible person only if supported by evidence or task text
            return `### ${index + 1}. ${title}

- **Task Scope:** ${description}
- **Evidence Status:** **${statusLabel}**${reviewDetail}
- **Verification Note:** ${reason}
${sourcesBlock}
`;
        }).join('\n') + '\n';
    }

    report += `---

## 4. Blockers and Risks
${formatSectionFindings(analysis.blockers, 'No active technical blockers or operational risks identified.')}
---

## 5. Dependencies
${formatSectionFindings(analysis.dependencies, 'No critical external dependencies identified.')}
---

## 6. People and Responsibilities
`;

    // Filter people findings to strictly exclude placeholders like [YOUR NAME]
    const validPeople = (analysis.people || []).filter((person) => {
        const title = (person.title || '').trim();
        return !title.includes('[YOUR NAME]') && !title.toLowerCase().includes('placeholder');
    });

    if (validPeople.length === 0) {
        report += `*No personnel assignments or team responsibilities explicitly confirmed in source documents.*\n\n`;
    } else {
        report += validPeople.map((person, index) => {
            const name = cleanText(person.title);
            const role = cleanText(person.description);
            const statusLabel = getEvidenceStatusLabel(person.evidenceStatus);
            const sourcesBlock = formatSources(person.verifiedEvidence || person.evidence);

            return `### ${index + 1}. ${name}

- **Role & Responsibilities:** ${role}
- **Evidence Status:** **${statusLabel}**
${sourcesBlock}
`;
        }).join('\n') + '\n';
    }

    report += `---

## 7. Missing Information
`;

    if (!analysis.missingInformation || analysis.missingInformation.length === 0) {
        report += `*No critical documentation gaps identified.*\n\n`;
    } else {
        report += analysis.missingInformation.map((item, index) => {
            const title = cleanText(item.title);
            const description = cleanText(item.description);
            const sourcesBlock = formatSources(item.verifiedEvidence || item.evidence);

            return `### ${index + 1}. ${title}

- **Documentation Gap:** ${description}
- **Epistemic Classification:** Identified as missing or unconfirmed information. The absence of documentation is not marked as a verified factual claim.
${sourcesBlock}
`;
        }).join('\n') + '\n';
    }

    report += `---

## 8. Cross-Document Conflicts
`;

    const conflicts = analysis.conflicts || [];
    if (conflicts.length === 0) {
        if (totalDocs < 2) {
            report += `*Cross-document conflict detection requires multiple uploaded documents. Only 1 document was analyzed in this workspace.*\n\n`;
        } else {
            report += `*No direct cross-document contradictions were identified across the ${totalDocs} uploaded documents. Note: The absence of detected conflicts does not guarantee that documents are fully exhaustive or reconciled.*\n\n`;
        }
    } else {
        report += conflicts.map((conflict, index) => {
            const title = cleanText(conflict.title);
            const description = cleanText(conflict.description);
            const resolutionLabel = conflict.resolutionStatus === 'resolved'
                ? 'Resolved by Human Reviewer'
                : 'Unresolved — Human Resolution Required';

            const reviewerInfo = conflict.review && conflict.review.reviewerEmail
                ? `\n- **Reviewer Note:** "${cleanText(conflict.review.comment || '')}" (by ${cleanText(conflict.review.reviewerEmail)})`
                : '';

            const claimsBlock = (conflict.claims || []).map((c, cIdx) => {
                const claimText = cleanText(c.claim);
                const file = cleanText(c.sourceFile || 'Uploaded Document');
                const quote = cleanText(c.quote || '');
                const pageInfo = Number.isInteger(c.pageNumber) ? ` • Page ${c.pageNumber}` : '';
                const evidenceLabel = getEvidenceStatusLabel(c.evidenceStatus);

                return `  - **Claim ${cIdx + 1} (${file}${pageInfo}):** "${claimText}"\n    - **Quote:** "${quote}"\n    - **Evidence Status:** **${evidenceLabel}**`;
            }).join('\n');

            return `### ${index + 1}. ${title}

- **Conflict Scope:** ${description}
- **Resolution Status:** **${resolutionLabel}**${reviewerInfo}
- **Conflicting Claims:**
${claimsBlock}
- **Governance Notice:** HandoverX flags contradictions between sources but does not automatically choose an authoritative version. Human verification is required to determine the active operational truth.
`;
        }).join('\n') + '\n';
    }

    report += `---

## 9. Evidence and Review Summary

### 9.1 Verification Breakdown
- **Total Ingested Sources:** ${totalDocs} document(s)
- **Source-Supported Findings:** ${sourceSupportedCount} (Exact quotations verified in referenced files)
- **Inferred Findings (Needs Confirmation):** ${inferredCount} (Derived context requiring human validation)
- **Evidence-Missing Findings:** ${missingCount} (Unverified claims requiring source documentation)
- **Cross-Document Conflicts:** ${conflicts.length} (${conflicts.filter(c => c.resolutionStatus === 'resolved').length} Resolved, ${conflicts.filter(c => c.resolutionStatus !== 'resolved').length} Unresolved)

### 9.2 Epistemic Governance & Human Confirmation
- **Human Review Status:** ${humanReviewStatusLine}
- **Review Summary:** ${approvedCount} Approved • ${changesRequestedCount} Changes Requested • ${rejectedCount} Rejected • ${pendingReviewCount} Pending Review
- **Epistemic Notice:** Source-supported quotations confirm that referenced statements appear in ingested documents. They do not constitute an independent guarantee that external systems currently reflect these statements, nor do they represent human approval of the handover.
- **Action Required:** Team leads must independently review all findings categorized as **Inferred — Needs Confirmation** and **Evidence Missing** before this report is used for final handover sign-off.

---

*Generated by HandoverX Knowledge Continuity Engine.*
`;

    return report;
}

module.exports = {
    generateHandoverReport,
    cleanText,
    decodeHtmlEntities
};
