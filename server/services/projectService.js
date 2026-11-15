
const { db } = require('../config/firebaseAdmin');
const { FieldValue } = require('firebase-admin/firestore');

const projectsCollection = db.collection('projects');

// Create a new project
async function createProject({ name, description = '' }, user) {
    if (typeof name !== 'string' || !name.trim()) {
        throw new Error('Project name is required.');
    }

    const projectRef = projectsCollection.doc();

    const projectData = {
        name: name.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        ownerId: user.uid,
        memberIds: [user.uid],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    };

    await projectRef.set(projectData);

    await projectRef.collection('members').doc(user.uid).set({
        uid: user.uid,
        email: user.email || null,
        role: 'owner',
        joinedAt: FieldValue.serverTimestamp()
    });

    const savedProject = await projectRef.get();

    return {
        projectId: projectRef.id,
        ...savedProject.data()
    };
}

// Get project details
async function getProject(projectId) {
    const projectDoc = await projectsCollection.doc(projectId).get();

    if (!projectDoc.exists) return null;

    return {
        projectId: projectDoc.id,
        ...projectDoc.data()
    };
}

// Check project membership
async function getProjectMembership(projectId, userId) {
    const memberDoc = await projectsCollection
        .doc(projectId)
        .collection('members')
        .doc(userId)
        .get();

    return memberDoc.exists ? memberDoc.data() : null;
}

// Verify project membership
async function verifyProjectAccess(projectId, userId) {
    const membership = await getProjectMembership(projectId, userId);

    if (!membership) {
        throw new Error('You do not have access to this project.');
    }

    return membership;
}

// Save uploaded document metadata, analysis and report
async function saveProjectHandover(projectId, user, documents, analysis, report) {
    const projectRef = projectsCollection.doc(projectId);
    const batch = db.batch();

    for (const doc of documents) {
        const documentRef = projectRef
            .collection('documents')
            .doc(doc.documentId);

        const text = typeof doc.extractedText === 'string' ? doc.extractedText : '';
        const preview = text.length > 0 ? text.slice(0, 10000) : null;

        batch.set(documentRef, {
            documentId: doc.documentId,
            originalName: doc.originalName,
            storedName: doc.storedName,
            format: doc.format,
            size: doc.size,
            pageCount: doc.pages.length,
            extractedTextPreview: preview,
            uploadedBy: user.uid,
            createdAt: FieldValue.serverTimestamp()
        });
    }

    batch.set(projectRef.collection('analysis').doc('latest'), {
        analysis,
        updatedBy: user.uid,
        updatedAt: FieldValue.serverTimestamp()
    });

    batch.set(projectRef.collection('reports').doc('latest'), {
        report,
        updatedBy: user.uid,
        updatedAt: FieldValue.serverTimestamp()
    });

    batch.update(projectRef, {
        updatedAt: FieldValue.serverTimestamp()
    });

    await batch.commit();

    return {
        savedDocuments: documents.length,
        analysisSaved: true,
        reportSaved: true
    };
}

// Get all projects for an authenticated user (as owner or member)
async function getUserProjects(userId) {
    const projectMap = new Map();

    // 1. Projects where user is ownerId
    const ownerSnap = await projectsCollection
        .where('ownerId', '==', userId)
        .get();

    for (const doc of ownerSnap.docs) {
        projectMap.set(doc.id, {
            projectId: doc.id,
            ...doc.data()
        });
    }

    // 2. Projects where user is in memberIds array
    try {
        const memberIdsSnap = await projectsCollection
            .where('memberIds', 'array-contains', userId)
            .get();

        for (const doc of memberIdsSnap.docs) {
            if (!projectMap.has(doc.id)) {
                projectMap.set(doc.id, {
                    projectId: doc.id,
                    ...doc.data()
                });
            }
        }
    } catch {
        // Ignore
    }

    // Convert to array and attach document counts efficiently
    const projects = Array.from(projectMap.values());

    // Enrich each project with its documentCount and serialized timestamps
    const enrichedProjects = await Promise.all(
        projects.map(async (p) => {
            let docCount = 0;
            try {
                const countSnap = await projectsCollection.doc(p.projectId).collection('documents').count().get();
                docCount = countSnap.data().count;
            } catch {
                // Fallback if count() fails
            }

            return {
                ...p,
                documentCount: docCount,
                createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : p.createdAt,
                updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate().toISOString() : p.updatedAt
            };
        })
    );

    // Sort by updatedAt desc, fallback to createdAt desc
    enrichedProjects.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
    });

    return enrichedProjects;
}

// Get full handover data for a project (documents, latest analysis, latest report)
async function getProjectHandover(projectId) {
    const projectRef = projectsCollection.doc(projectId);

    // Fetch documents in the subcollection
    const docsSnap = await projectRef.collection('documents').get();
    const documents = docsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
            documentId: data.documentId || doc.id,
            originalName: data.originalName,
            storedName: data.storedName,
            format: data.format,
            size: data.size,
            pageCount: data.pageCount || 0,
            extractedTextPreview: data.extractedTextPreview || null,
            uploadedBy: data.uploadedBy,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
        };
    });

    // Sort newest first
    documents.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
    });

    // Fetch latest analysis
    const analysisDoc = await projectRef
        .collection('analysis')
        .doc('latest')
        .get();

    const rawAnalysis = analysisDoc.exists ? analysisDoc.data().analysis : null;

    // Fetch all reviews for this project
    const reviewsSnap = await projectRef.collection('reviews').get();
    const reviewsMap = {};
    reviewsSnap.forEach((doc) => {
        const data = doc.data();
        reviewsMap[doc.id] = {
            findingId: doc.id,
            status: data.status || 'pending-review',
            reviewedBy: data.reviewedBy || '',
            reviewerEmail: data.reviewerEmail || '',
            reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt,
            comment: data.comment || '',
            findingTitle: data.findingTitle || ''
        };
    });

    // Enrich analysis with persisted review statuses
    let analysis = rawAnalysis;
    if (rawAnalysis) {
        const categories = ['decisions', 'tasks', 'blockers', 'dependencies', 'people', 'missingInformation', 'conflicts'];
        analysis = { ...rawAnalysis };
        for (const cat of categories) {
            if (Array.isArray(analysis[cat])) {
                analysis[cat] = analysis[cat].map((item) => {
                    const review = reviewsMap[item.id];
                    const isConflict = cat === 'conflicts';
                    let resolved = item.resolutionStatus || 'unresolved';
                    if (review && (review.status === 'approved' || review.status === 'resolved')) {
                        resolved = 'resolved';
                    }
                    return {
                        ...item,
                        resolutionStatus: isConflict ? resolved : item.resolutionStatus,
                        reviewStatus: review ? review.status : 'pending-review',
                        review: review || null
                    };
                });
            }
        }
    }

    // Fetch latest report
    const reportDoc = await projectRef
        .collection('reports')
        .doc('latest')
        .get();

    const report = reportDoc.exists ? reportDoc.data().report : null;

    return {
        projectId,
        totalDocuments: documents.length,
        documents,
        analysis,
        reviews: reviewsMap,
        report
    };
}

// Save or update a human review decision for a finding
async function saveFindingReview(projectId, user, { findingId, status, comment, findingTitle, editedTitle, editedDescription }) {
    if (!findingId || typeof findingId !== 'string') {
        throw new Error('Finding ID is required.');
    }
    const validStatuses = ['approved', 'rejected', 'changes-requested', 'pending-review', 'resolved'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid review status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const projectRef = projectsCollection.doc(projectId);
    const reviewRef = projectRef.collection('reviews').doc(findingId);

    const reviewData = {
        findingId,
        status,
        comment: typeof comment === 'string' ? comment.trim() : '',
        findingTitle: typeof findingTitle === 'string' ? findingTitle.trim() : '',
        reviewedBy: user.uid,
        reviewerEmail: user.email || 'Team Reviewer',
        reviewedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    };

    await reviewRef.set(reviewData, { merge: true });

    // If finding title or description was edited, update analysis/latest in Firestore
    const analysisDocRef = projectRef.collection('analysis').doc('latest');
    const analysisDoc = await analysisDocRef.get();
    let currentAnalysis = analysisDoc.exists ? analysisDoc.data().analysis : null;

    if (currentAnalysis) {
        const categories = ['decisions', 'tasks', 'blockers', 'dependencies', 'people', 'missingInformation', 'conflicts'];
        let updated = false;

        for (const cat of categories) {
            if (Array.isArray(currentAnalysis[cat])) {
                currentAnalysis[cat] = currentAnalysis[cat].map((item) => {
                    if (item.id === findingId) {
                        updated = true;
                        return {
                            ...item,
                            title: (editedTitle && editedTitle.trim()) ? editedTitle.trim() : item.title,
                            description: (editedDescription && editedDescription.trim()) ? editedDescription.trim() : item.description
                        };
                    }
                    return item;
                });
            }
        }

        if (updated) {
            await analysisDocRef.update({
                analysis: currentAnalysis,
                updatedAt: FieldValue.serverTimestamp()
            });
        }
    }

    // Now re-fetch handover to get enriched analysis and regenerate the report
    const handover = await getProjectHandover(projectId);
    const { generateHandoverReport } = require('./reportGenerator');
    const updatedReport = generateHandoverReport(handover.analysis, handover.documents);

    await projectRef.collection('reports').doc('latest').set({
        report: updatedReport,
        updatedBy: user.uid,
        updatedAt: FieldValue.serverTimestamp()
    });

    return {
        review: {
            ...reviewData,
            reviewedAt: new Date().toISOString()
        },
        analysis: handover.analysis,
        report: updatedReport
    };
}

module.exports = {
    createProject,
    getProject,
    getProjectMembership,
    verifyProjectAccess,
    saveProjectHandover,
    getUserProjects,
    getProjectHandover,
    saveFindingReview
};
