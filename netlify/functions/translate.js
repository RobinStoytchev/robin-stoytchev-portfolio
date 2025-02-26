// netlify/functions/translate.js

exports.handler = async (event) => {
    const { text, target_lang, source_lang } = JSON.parse(event.body);
    try {
        // Ensure text is an array (batch translation)
        if (!Array.isArray(text) || text.length === 0) {
            throw new Error('Invalid request: Expected text to be a non-empty array of strings');
        }

        const apiKey = process.env.DEEPL_API_KEY || '267f95ef-d4f0-4ddc-9655-36e8cde02416:fx'; // Use env var or fallback

        const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text, // Already an array from index.js
                target_lang: target_lang,
                source_lang: source_lang || 'EN' // Default to English if not provided
            })
        });

        if (!response.ok) {
            throw new Error(`DeepL API error: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Translation function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};