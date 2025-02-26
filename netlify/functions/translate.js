// netlify/functions/translate.js

exports.handler = async (event) => {
    const { text, target_lang, source_lang } = JSON.parse(event.body);
    try {
        const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Authorization': 'DeepL-Auth-Key 267f95ef-d4f0-4ddc-9655-36e8cde02416:fx', // Your DeepL key
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, target_lang, source_lang })
        });
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};