const express = require('express');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken');

const {
    createProject,
    getProject,
    verifyProjectAccess,
    getUserProjects,
    getProjectHandover,
    saveFindingReview
} = require('../services/projectService');

const router = express.Router();

// List all projects for authenticated user
router.get('/', verifyFirebaseToken, async (req, res) => {
    try {
        const projects = await getUserProjects(req.user.uid);

        res.json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch user projects.'
        });
    }
});

// Create project
router.post('/', verifyFirebaseToken, async (req, res) => {
    try {
        const project = await createProject(req.body, req.user);

        res.status(201).json({
            success: true,
            message: 'Project created successfully.',
            project
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Get project details
router.get('/:projectId', verifyFirebaseToken, async (req, res) => {
    try {
        await verifyProjectAccess(req.params.projectId, req.user.uid);

        const project = await getProject(req.params.projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found.'
            });
        }

        res.json({ success: true, project });
    } catch (error) {
        res.status(403).json({
            success: false,
            message: error.message
        });
    }
});

// Get full handover data for a project (documents, latest analysis, latest report)
router.get('/:projectId/handover', verifyFirebaseToken, async (req, res) => {
    try {
        await verifyProjectAccess(req.params.projectId, req.user.uid);

        const handover = await getProjectHandover(req.params.projectId);

        res.json({
            success: true,
            handover
        });
    } catch (error) {
        res.status(403).json({
            success: false,
            message: error.message
        });
    }
});

// Submit or update a human review decision for a finding
router.post('/:projectId/reviews', verifyFirebaseToken, async (req, res) => {
    try {
        await verifyProjectAccess(req.params.projectId, req.user.uid);

        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid request body. JSON payload is required.'
            });
        }

        const { findingId, status, comment, findingTitle, editedTitle, editedDescription } = req.body;

        if (!findingId || typeof findingId !== 'string' || !findingId.trim()) {
            return res.status(400).json({
                success: false,
                message: 'findingId is required.'
            });
        }

        const validStatuses = ['approved', 'rejected', 'changes-requested', 'pending-review', 'resolved'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid review status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const result = await saveFindingReview(req.params.projectId, req.user, {
            findingId: findingId.trim(),
            status,
            comment,
            findingTitle,
            editedTitle,
            editedDescription
        });

        res.json({
            success: true,
            message: `Finding marked as ${status}.`,
            review: result.review,
            analysis: result.analysis,
            report: result.report
        });
    } catch (error) {
        console.error('Error saving finding review:', error);
        res.status(error.message && error.message.includes('access') ? 403 : 500).json({
            success: false,
            message: error.message || 'Failed to save review decision.'
        });
    }
});

module.exports = router;