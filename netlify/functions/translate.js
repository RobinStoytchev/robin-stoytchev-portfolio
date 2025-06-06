const axios = require('axios');

exports.handler = async (event, context) => {
    try {
        console.log('Received translation request at:', new Date().toISOString());
        // Parse the incoming request body
        const { text, targetLang } = JSON.parse(event.body);

        if (!text || !targetLang) {
            console.log('Missing text or target language in request');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing text or target language' }),
            };
        }

        // Get the API key from environment variables
        const apiKey = process.env.DEEPL_API_KEY;
        console.log('Using DeepL API Key:', apiKey ? 'Key exists' : 'Key missing');

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'DeepL API key not found in environment variables' }),
            };
        }

        // Make the request to DeepL API
        console.log('Sending request to DeepL with text:', text, 'and targetLang:', targetLang);
        const startTime = Date.now();
        const response = await axios.post(
            'https://api-free.deepl.com/v2/translate',
            {
                text: [text],
                target_lang: targetLang.toUpperCase(),
            },
            {
                headers: {
                    Authorization: `DeepL-Auth-Key ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('DeepL API response time:', Date.now() - startTime, 'ms');
        console.log('DeepL API response:', response.data);
        const translatedText = response.data.translations[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ translatedText }),
        };
    } catch (error) {
        console.error('Translation error at:', new Date().toISOString(), error.message, error.response ? error.response.data : '');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Translation failed', details: error.message }),
        };
    }
};