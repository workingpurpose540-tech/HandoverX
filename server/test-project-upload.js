
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (question) =>
    new Promise((resolve) => rl.question(question, resolve));

async function main() {
    try {
        const email = await ask('Firebase test email: ');
        const password = await ask('Firebase test password: ');
        const filePathInput = await ask('Full path to a PDF/DOCX/TXT/MD file: ');

        const filePath = path.resolve(filePathInput.trim());

        if (!fs.existsSync(filePath)) {
            throw new Error('The selected file does not exist.');
        }

        if (!process.env.FIREBASE_WEB_API_KEY) {
            throw new Error('FIREBASE_WEB_API_KEY is missing from .env');
        }

        // Sign in to Firebase
        const authResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                })
            }
        );

        const authData = await authResponse.json();

        if (!authResponse.ok) {
            throw new Error(authData.error?.message || 'Firebase login failed.');
        }

        console.log('\nFirebase authentication successful!');

        // Prepare multipart upload
        const form = new FormData();

        form.append('projectId', '4kKQsDgEZ3fkv44DaKYB');

        const buffer = fs.readFileSync(filePath);
        const file = new Blob([buffer]);

        form.append('documents', file, path.basename(filePath));

        console.log('Uploading document and running analysis...');

        let uploadResponse;

        try {
            uploadResponse = await fetch(
                'http://127.0.0.1:5000/api/upload',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${authData.idToken}`
                    },
                    body: form
                }
            );
        } catch (error) {
            console.error('Upload connection error:', error);
            console.error('Cause:', error.cause);
            throw error;
        }

        const result = await uploadResponse.json();


        console.log('Upload HTTP status:', uploadResponse.status);
        console.log('\nUpload API response:');
        console.log(JSON.stringify(result, null, 2));

        if (!uploadResponse.ok) {
            throw new Error(result.message || 'Upload failed.');
        }

        console.log('\nUpload and project save test completed!');

    } catch (error) {
        console.error('\nTest failed:', error.message);
    } finally {
        rl.close();
    }
}

main();
