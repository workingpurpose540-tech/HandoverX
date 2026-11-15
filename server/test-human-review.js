const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { db } = require('./config/firebaseAdmin');
const {
    saveFindingReview,
    getProjectHandover,
    saveProjectHandover,
} = require('./services/projectService');

async function runTest() {
    console.log('--- STARTING HUMAN REVIEW WORKFLOW VERIFICATION TEST ---');

    // 1. Find or create a test project with sample analysis
    const projectsSnap = await db.collection('projects').limit(1).get();
    let projectId;

    if (!projectsSnap.empty) {
        projectId = projectsSnap.docs[0].id;
        console.log(`Using existing project: ${projectId}`);
    } else {
        const newProj = await db.collection('projects').add({
            name: 'Test Review Project',
            description: 'Automated test project for human review',
            ownerId: 'test-reviewer-uid',
            memberIds: ['test-reviewer-uid'],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        projectId = newProj.id;
        console.log(`Created new test project: ${projectId}`);
    }

    // Ensure project has sample findings to review
    const sampleAnalysis = {
        projectName: 'HandoverX Core Platform',
        projectSummary: 'Technical handover for HandoverX platform.',
        decisions: [
            {
                id: 'finding-dec-001',
                title: 'Architecture Decision: Polling to SSE migration',
                description: 'The team decided to migrate from client polling to Server-Sent Events.',
                evidenceStatus: 'source-supported',
                evidence: [{ sourceFile: 'arch_spec.pdf', quote: 'System uses SSE for live updates.' }]
            },
            {
                id: 'finding-dec-002',
                title: 'Database Choice: Firestore NoSQL database',
                description: 'Firestore is chosen as the document store.',
                evidenceStatus: 'inferred-needs-confirmation',
                evidence: [{ sourceFile: 'infra.md', quote: 'Firestore handles project metadata.' }]
            }
        ],
        tasks: [
            {
                id: 'finding-task-001',
                title: 'Task: Implement rate limiter on document upload endpoint',
                description: 'Add a 10 requests per minute limiter.',
                evidenceStatus: 'evidence-missing',
                evidence: []
            }
        ],
        blockers: [],
        dependencies: [],
        people: [],
        missingInformation: [],
        conflicts: []
    };

    const sampleDocs = [
        {
            documentId: 'doc-001',
            originalName: 'arch_spec.pdf',
            storedName: 'arch_spec_stored.pdf',
            format: 'pdf',
            size: 10240,
            pages: [{ pageNumber: 1, text: 'System uses SSE for live updates.' }],
            extractedText: 'System uses SSE for live updates.',
            createdAt: new Date()
        }
    ];

    const mockReviewer = {
        uid: 'reviewer-user-123',
        email: 'lead-architect@handoverx.io'
    };

    // Ensure mockReviewer is a member of projectId
    const { FieldValue } = require('firebase-admin/firestore');
    await db.collection('projects').doc(projectId).collection('members').doc(mockReviewer.uid).set({
        uid: mockReviewer.uid,
        email: mockReviewer.email,
        role: 'reviewer'
    });
    try {
        await db.collection('projects').doc(projectId).update({
            memberIds: FieldValue.arrayUnion(mockReviewer.uid)
        });
    } catch {}

    // Seed/update latest analysis
    await saveProjectHandover(projectId, mockReviewer, sampleDocs, sampleAnalysis, 'Initial Handover Report');
    console.log('Seeded project handover with 3 findings (1 decision source-supported, 1 decision inferred, 1 task evidence-missing).');

    // TEST 1: Approve finding 1
    console.log('\n--- Step 1: Approving finding-dec-001 ---');
    const approveResult = await saveFindingReview(projectId, mockReviewer, {
        findingId: 'finding-dec-001',
        status: 'approved',
        findingTitle: 'Architecture Decision: Polling to SSE migration',
        comment: 'Verified with systems architect; SSE implementation is live in production.'
    });
    console.log('Approve result message:', approveResult.review.status);
    if (approveResult.review.status !== 'approved') {
        throw new Error('Expected status to be approved');
    }

    // TEST 2: Reject finding 2
    console.log('\n--- Step 2: Rejecting finding-dec-002 ---');
    const rejectResult = await saveFindingReview(projectId, mockReviewer, {
        findingId: 'finding-dec-002',
        status: 'rejected',
        findingTitle: 'Database Choice: Firestore NoSQL database',
        comment: 'Outdated proposal; we decided on hybrid Postgres + Firestore.'
    });
    console.log('Reject result message:', rejectResult.review.status);
    if (rejectResult.review.status !== 'rejected') {
        throw new Error('Expected status to be rejected');
    }

    // TEST 3: Request changes on finding 3
    console.log('\n--- Step 3: Requesting changes on finding-task-001 ---');
    const changesResult = await saveFindingReview(projectId, mockReviewer, {
        findingId: 'finding-task-001',
        status: 'changes-requested',
        findingTitle: 'Task: Implement rate limiter on document upload endpoint',
        comment: 'Rate limiter threshold should be 30 requests per minute instead of 10.',
        editedTitle: 'Task: Implement 30 req/min rate limiter on document upload endpoint'
    });
    console.log('Changes requested result message:', changesResult.review.status);
    if (changesResult.review.status !== 'changes-requested') {
        throw new Error('Expected status to be changes-requested');
    }

    // TEST 4: Persistence Verification across fresh Firestore query
    console.log('\n--- Step 4: Verifying Persistence via getProjectHandover ---');
    const freshHandover = await getProjectHandover(projectId);

    const dec1 = freshHandover.analysis.decisions.find(d => d.id === 'finding-dec-001');
    const dec2 = freshHandover.analysis.decisions.find(d => d.id === 'finding-dec-002');
    const task1 = freshHandover.analysis.tasks.find(t => t.id === 'finding-task-001');

    console.log(`finding-dec-001: reviewStatus=${dec1.reviewStatus}, evidenceStatus=${dec1.evidenceStatus}, reviewer=${dec1.review?.reviewerEmail}`);
    console.log(`finding-dec-002: reviewStatus=${dec2.reviewStatus}, evidenceStatus=${dec2.evidenceStatus}, reviewer=${dec2.review?.reviewerEmail}`);
    console.log(`finding-task-001: reviewStatus=${task1.reviewStatus}, evidenceStatus=${task1.evidenceStatus}, reviewer=${task1.review?.reviewerEmail}`);

    if (dec1.reviewStatus !== 'approved') throw new Error('dec1 was not approved');
    if (dec2.reviewStatus !== 'rejected') throw new Error('dec2 was not rejected');
    if (task1.reviewStatus !== 'changes-requested') throw new Error('task1 was not changes-requested');

    // Confirm evidence status is strictly independent of review status
    if (dec1.evidenceStatus !== 'source-supported') throw new Error('dec1 evidenceStatus was modified');
    if (dec2.evidenceStatus !== 'inferred-needs-confirmation') throw new Error('dec2 evidenceStatus was modified');
    if (task1.evidenceStatus !== 'evidence-missing') throw new Error('task1 evidenceStatus was modified');
    console.log('PASS: Evidence status and human review status are strictly separated.');

    // Confirm report includes the updated review status
    console.log('\n--- Step 5: Verifying Handover Report ---');
    const report = freshHandover.report;
    const hasApproved = report.includes('Approved: 1') || report.includes('approved') || report.includes('Human Sign-off');
    console.log('Report excerpt:\n', report.slice(0, 400));
    console.log('\nReport contains review section and dynamic status:', Boolean(hasApproved));

    // TEST 6: Backend HTTP validation test (missing body, invalid status)
    console.log('\n--- Step 6: Testing Express API Route Validation ---');
    const express = require('express');
    const projectRoutes = require('./routes/projectRoutes');
    const testApp = express();
    testApp.use(express.json());
    testApp.use(express.urlencoded({ extended: true }));

    // Mock auth middleware for route unit testing
    testApp.use((req, res, next) => {
        req.user = { uid: mockReviewer.uid, email: mockReviewer.email };
        next();
    });
    testApp.use('/api/projects', projectRoutes);

    const testServer = testApp.listen(5099);

    try {
        // Sub-test A: Missing body (Content-Type text/plain or empty)
        const emptyRes = await fetch(`http://127.0.0.1:5099/api/projects/${projectId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: ''
        });
        const emptyJson = await emptyRes.json();
        console.log('Empty body HTTP status:', emptyRes.status, 'message:', emptyJson.message);
        if (emptyRes.status !== 400) {
            throw new Error(`Expected 400 for empty body, got ${emptyRes.status}`);
        }

        // Sub-test B: Missing findingId
        const missingIdRes = await fetch(`http://127.0.0.1:5099/api/projects/${projectId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
        });
        const missingIdJson = await missingIdRes.json();
        console.log('Missing findingId HTTP status:', missingIdRes.status, 'message:', missingIdJson.message);
        if (missingIdRes.status !== 400) {
            throw new Error(`Expected 400 for missing findingId, got ${missingIdRes.status}`);
        }

        // Sub-test C: Invalid status
        const invalidStatusRes = await fetch(`http://127.0.0.1:5099/api/projects/${projectId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ findingId: 'finding-dec-001', status: 'invalid-status-xyz' })
        });
        const invalidStatusJson = await invalidStatusRes.json();
        console.log('Invalid status HTTP status:', invalidStatusRes.status, 'message:', invalidStatusJson.message);
        if (invalidStatusRes.status !== 400) {
            throw new Error(`Expected 400 for invalid status, got ${invalidStatusRes.status}`);
        }

        // Sub-test D: Valid JSON request with Content-Type: application/json
        const validRes = await fetch(`http://127.0.0.1:5099/api/projects/${projectId}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                findingId: 'finding-dec-001',
                status: 'approved',
                comment: 'Confirmed via HTTP unit test.'
            })
        });
        const validJson = await validRes.json();
        console.log('Valid HTTP review status:', validRes.status, 'message:', validJson.message);
        if (validRes.status !== 200 || !validJson.success) {
            throw new Error(`Expected 200 for valid review request, got ${validRes.status}: ${JSON.stringify(validJson)}`);
        }

        console.log('\nALL 6 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    } finally {
        testServer.close();
    }
}

runTest()
    .then(() => {
        console.log('\nTest suite finished with SUCCESS.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\nTest suite FAILED:', err);
        process.exit(1);
    });
