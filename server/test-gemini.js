require('dotenv').config();

const ai = require('./config/gemini');

async function testGemini() {
    console.log('Testing Gemini connection...');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: 'Return JSON only: {"projectName":"HandoverX","decisions":[]}'
        });

        console.log('Gemini response:', response.text);

    } catch (error) {
        console.error('Gemini test failed:', error);
    }
}

testGemini();