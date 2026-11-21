const { auth } = require('../config/firebaseAdmin');

async function verifyFirebaseToken(req, res, next) {
    // If user is already authenticated (e.g., test harness or internal middleware), proceed
    if (req.user && req.user.uid) {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authentication token is required.'
        });
    }

    const token = authHeader.slice(7).trim();

    try {
        const decodedToken = await auth.verifyIdToken(token);

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || null
        };

        next();

    } catch (error) {
        console.error('Firebase token verification failed:', error.code || error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });
    }
}

module.exports = verifyFirebaseToken;