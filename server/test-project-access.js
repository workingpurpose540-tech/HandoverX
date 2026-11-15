
require('dotenv').config();
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
    try {
        const email = await ask('Firebase test email: ');
        const password = await ask('Firebase test password: ');

        const login = await fetch(
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

        const auth = await login.json();

        if (!login.ok) {
            throw new Error(auth.error?.message || 'Login failed');
        }

        console.log('\nFirebase login successful!');

        const response = await fetch(
            'http://127.0.0.1:5000/api/projects/4kKQsDgEZ3fkv44DaKYB',
            {
                headers: {
                    Authorization: `Bearer ${auth.idToken}`
                }
            }
        );

        const result = await response.json();

        console.log('\nProject access HTTP status:', response.status);
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        rl.close();
    }
}

main();
