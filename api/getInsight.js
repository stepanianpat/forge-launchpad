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
        const { query } = request.body;

        if (!query || typeof query !== 'string' || query.trim() === "") {
            return response.status(400).json({ error: 'Query is missing or invalid in request body.' });
        }

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an SEO Title Generation Bot. Your SOLE task is to generate 3 to 5 SEO title suggestions based on the user's input. Each title MUST be on a new line. Do NOT include any introductory text, explanations, or conversational phrases. Only output the titles."
                    },
                    {
                        role: "user",
                        content: query 
                    }
                ],
                max_tokens: 100,
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