
const ai = require('../config/gemini');

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithRetry(prompt, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json'
                }
            });
        } catch (error) {
            const retryable = [429, 500, 502, 503, 504].includes(
                Number(error.status || error.code)
            );

            if (!retryable || attempt === maxAttempts) {
                throw error;
            }

            const delay = attempt * 3000;
            console.log(`Gemini attempt ${attempt} failed. Retrying in ${delay / 1000}s...`);

            await sleep(delay);
        }
    }
}

module.exports = { generateWithRetry };
