const fs = require("fs");
const yaml = require("js-yaml");
const axios = require("axios");

const supportbotai = yaml.load(fs.readFileSync("./Configs/supportbot-ai.yml", "utf8"));

async function generateImage(prompt, negativePrompt, cfgScale) {
    try {
        const response = await axios.post('https://api.pepperai.xyz/generate', {
            prompt: prompt,
            negativePrompt: negativePrompt,
            cfgScale: cfgScale
        }, {
            headers: {
                'Authorization': `Bearer ${supportbotai.General.PepperAI_Key}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('PepperAI Response:', response.data); // Log the entire response for debugging

        if (response.data && response.data.imageUrl) {
            return response.data.imageUrl;
        } else {
            throw new Error(`Invalid response structure: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        console.error('PepperAI Image Generation Error:', error);
        throw error;
    }
}

module.exports = generateImage;
