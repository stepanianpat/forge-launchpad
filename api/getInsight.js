// This is a Node.js serverless function
export default function handler(request, response) {
    if (request.method === 'POST') {
        // Get the query from the request body
        const { query } = request.body;

        // For now, just send back a simple message
        // Later, we'll call OpenAI API here
        response.status(200).json({ 
            message: `Serverless function received your query: "${query}". AI processing will happen here.`,
            originalQuery: query 
        });
    } else {
        // Handle non-POST requests (e.g., if someone just browses to the URL)
        response.status(405).json({ error: 'Method not allowed. Please use POST.' });
    }
}