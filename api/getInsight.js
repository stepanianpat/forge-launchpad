import OpenAI from 'openai';

const openai = new OpenAI();

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        response.status(204).end();
        return;
    }

    if (request.method === 'POST') {
        const { query, generationType, context } = request.body;

        if (!query || typeof query !== 'string' || query.trim() === "") {
            return response.status(400).json({ error: 'Query (topic/keywords) is missing or invalid.' });
        }
        if (!generationType || (generationType !== 'title' && generationType !== 'description')) {
            return response.status(400).json({ error: 'Invalid or missing generationType. Must be "title" or "description".' });
        }

        let systemPromptContent = "";
        let userPromptContent = query;
        let maxTokens = 100;

        if (generationType === 'title') {
            systemPromptContent = "You are an expert SEO Title Architect. Your SOLE task is to generate 3 to 5 compelling, keyword-rich, and SEO-friendly title options based on the user's topic or keywords. Each title MUST be on a new line. Do NOT include any introductory text, explanations, or conversational phrases. Only output the titles.";
        } else if (generationType === 'description') {
            systemPromptContent = "You are an expert SEO Meta Description Writer. Your SOLE task is to generate 2-3 concise and compelling meta description options (around 155 characters each) for the given topic/keywords. If additional context (like an existing title) is provided, use it to enhance the descriptions. Each description MUST be on a new line. Do NOT include any introductory text, explanations, or conversational phrases. Only output the descriptions.";
            maxTokens = 180;
            if (context && typeof context === 'string' && context.trim() !== "") {
                userPromptContent = `Topic/Keywords: ${query}\nExisting Title/Focus (for context): ${context.trim()}`;
            }
        }

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: systemPromptContent
                    },
                    {
                        role: "user",
                        content: userPromptContent
                    }
                ],
                max_tokens: maxTokens, 
                temperature: 0.7, 
            });

            const aiResponseContent = completion.choices[0]?.message?.content?.trim();

            if (aiResponseContent) {
                response.status(200).json({ message: aiResponseContent });
            } else {
                console.error("OpenAI response content was empty or not found:", completion);
                response.status(500).json({ error: "Failed to get a valid response from AI." });
            }

        } catch (error) {
            console.error("Error calling OpenAI API:", error);
            let errorMessage = "An error occurred while communicating with the AI service.";
            if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
                errorMessage = `AI Service Error: ${error.response.data.error.message}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            response.status(500).json({ error: errorMessage });
        }
    } else {
        response.setHeader('Allow', ['POST', 'OPTIONS']);
        response.status(405).json({ error: `Method ${request.method} Not Allowed.` });
    }
}
