const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    // Parse the incoming request body
    const { text, targetLang } = JSON.parse(event.body);

    if (!text || !targetLang) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing text or target language' }),
      };
    }

    // Get the API key from environment variables
    const apiKey = process.env.DEEPL_API_KEY;

    // Make the request to DeepL API
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

    const translatedText = response.data.translations[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ translatedText }),
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Translation failed', details: error.message }),
    };
  }
};