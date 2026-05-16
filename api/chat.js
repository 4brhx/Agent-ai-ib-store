export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // System prompt for the AI agent
        const systemMessage = {
            role: 'system',
            content: `أنت Agent GPT-5.4، مساعد ذكاء اصطناعي متقدم ومحترف. أنت تتحدث العربية بطلاقة وتستطيع مساعدة المستخدمين في:
- كتابة وتحليل الأكواد البرمجية بجميع اللغات
- شرح المفاهيم التقنية والعلمية
- كتابة المقالات والمحتوى الإبداعي
- تقديم النصائح والاستشارات
- حل المشكلات والإجابة على الأسئلة

قواعد مهمة:
1. أجب دائماً بشكل مفصل ومفيد
2. استخدم اللغة العربية بشكل أساسي إلا إذا طُلب غير ذلك
3. عند كتابة الأكواد، قدم شرحاً واضحاً
4. كن ودوداً ومحترفاً في ردودك`
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
                'X-Title': 'Agent GPT-5.4'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages: [systemMessage, ...messages],
                temperature: 0.7,
                max_tokens: 4096,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API Error:', errorData);
            return res.status(response.status).json({ 
                error: 'API request failed',
                details: errorData 
            });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
