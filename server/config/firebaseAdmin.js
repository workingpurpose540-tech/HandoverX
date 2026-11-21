const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

let firebaseApp;

function cleanEnvValue(value) {
    if (!value || typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return trimmed.replace(/^["']|["'],?$/g, '').trim();
}

if (getApps().length === 0) {
    const projectId = cleanEnvValue(process.env.FIREBASE_PROJECT_ID);
    const clientEmail = cleanEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
    const rawKey = cleanEnvValue(process.env.FIREBASE_PRIVATE_KEY);
    const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;

    if (projectId && clientEmail && privateKey) {
        // Production (Render): initialise from environment variables.
        firebaseApp = initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
        });
    } else {
        // Local development: fall back to the service-account key file.
        const serviceAccount = require('./serviceAccountKey.json');
        firebaseApp = initializeApp({
            credential: cert(serviceAccount),
        });
    }
} else {
    firebaseApp = getApps()[0];
}

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

module.exports = { firebaseApp, auth, db };