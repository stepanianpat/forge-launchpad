// File: api/getInsight.js
import OpenAI from 'openai';

// Initialize the OpenAI client
// It will automatically use the OPENAI_API_KEY environment variable on Vercel
const openai = new OpenAI();

export default async function handler(request, response) {
    // Set CORS headers - still important!
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Only POST and OPTIONS needed now
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Only Content-Type needed

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        response.status(204).end();
        return;
    }

    // Handle actual POST request
    if (request.method === 'POST') {
        const { query } = request.body;

        if (!query || typeof query !== 'string' || query.trim() === "") {
            return response.status(400).json({ error: 'Query is missing or invalid in request body.' });
        }

        try {
            // Make the API call to OpenAI
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo", // Or use "gpt-4o-mini" for a balance of capability and cost
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that provides concise insights."
                    },
                    {
                        role: "user",
                        content: query // The user's query from the frontend
                    }
                ],
                max_tokens: 100, // Adjust as needed, limits the length of the response
                temperature: 0.7, // Adjust for creativity (0.2 more factual, 1.0 more creative)
            });

            // Extract the AI's response content
            const aiResponseContent = completion.choices[0]?.message?.content?.trim();

            if (aiResponseContent) {
                response.status(200).json({ message: aiResponseContent });
            } else {
                // This case might happen if the response structure is unexpected or content is empty
                console.error("OpenAI response content was empty or not found:", completion);
                response.status(500).json({ error: "Failed to get a valid response from AI." });
            }

        } catch (error) {
            console.error("Error calling OpenAI API:", error);
            // Send a more generic error to the client, but log the detailed one on the server
            let errorMessage = "An error occurred while communicating with the AI service.";
            if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
                // If OpenAI API returned a specific error message
                errorMessage = `AI Service Error: ${error.response.data.error.message}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            response.status(500).json({ error: errorMessage });
        }
    } else {
        // Handle other methods
        response.setHeader('Allow', ['POST', 'OPTIONS']);
        response.status(405).json({ error: `Method ${request.method} Not Allowed.` });
    }
}