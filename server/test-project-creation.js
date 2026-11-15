
require('dotenv').config();
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
    try {
        const email = await ask('Firebase test account email: ');
        const password = await ask('Firebase test account password: ');

        const loginResponse = await fetch(
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

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
            console.log('Firebase error code:', loginData.error?.message);
            console.log('HTTP status:', loginResponse.status);
            return;
        }

        console.log('Firebase authentication successful!');
        console.log('Sending authenticated request to HandoverX backend...');
        console.log('ID token received:', !!loginData.idToken);
        const projectResponse = await fetch(
            'http://127.0.0.1:5000/api/projects',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${loginData.idToken}`
                },
                body: JSON.stringify({
                    name: 'HandoverX Test Project',
                    description: 'Testing authenticated Firestore project creation.'
                })
            }
        );

        const projectData = await projectResponse.json();

        if (!projectResponse.ok) {
            throw new Error(projectData.message || 'Project creation failed.');
        }

        console.log('\nProject created successfully!');
        console.log(JSON.stringify(projectData, null, 2));

    } catch (error) {
        console.error('\nTest failed:', error);
        console.error('Error cause:', error.cause);
    } finally {
        rl.close();
    }
}

main();