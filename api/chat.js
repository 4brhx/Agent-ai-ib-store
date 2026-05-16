export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const API_KEY = process.env.OPENROUTER_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': req.headers.referer || 'https://agent-ai-ib-store.vercel.app',
                'X-Title': 'Agent GPT-5.4'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages: messages,
                temperature: 0.7,
                max_tokens: 4096,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API Error:', errorData);
            return res.status(response.status).json({ 
                error: { message: 'API request failed: ' + response.statusText }
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ 
            error: { message: 'Internal server error' }
        });
    }
}
