/* This is the backend: There is 2 sections */


/* Section 1: The main function */


// Importing 'NextResponse' from 'next/server' to handle HTTP responses.
// 'NextResponse' allows the server to send back a response to the user.
import { NextResponse } from "next/server";

// Importing the 'OpenAI' package, which gives us tools to interact with OpenAI's AI models like GPT.
// This allows us to generate AI-powered responses.
import OpenAI from 'openai'

/**
 * This is a special instruction (prompt) that we give to the AI, telling it how to behave.
 * It's like a job description that guides the AI in answering user questions.
 */

// The 'systemPrompt' variable holds the instructions for the AI.
// It explains how the AI should help users with questions about HeadStarterAI.
const systemPrompt = `
You are an AI-powered customer support assistant for HeadStarterAI, a platform that provides AI-driven interviews for software engineering positions.

1. HeadStarterAI offers AI-powered interviews for software engineering positions.
2. Our platform helps candidates practice and prepare for real job interviews.
3. We cover a wide range of topics, including algorithms, data structures, system design, and behavioral questions.
4. Users can access our services through our website or mobile app.
5. If asked about technical issues, guide users to our troubleshooting page or suggest contacting our technical support team.
6. Always maintain user privacy and do not share personal information.
7. If you're unsure about any information, it's okay to say you don't know and offer to connect the user with a human representative.

Your goal is to provide accurate information, assist with common inquires, and ensure a positive expereince for all headstarterAI users
`;

// This function handles incoming POST requests. POST requests are when users send data to the server, like filling out a form.
// The function is marked 'async' because it handles tasks that take time, like talking to the AI, without freezing the app.
export async function POST(req) {
    // Creating a new instance of OpenAI, which we'll use to communicate with the AI models.
    const openai = new OpenAI();

    // Extracting the data sent by the user in JSON format. 
    // 'await req.json()' is like asking the server to wait until the data is ready before continuing.
    const data = await req.json();

    // Requesting a response from the AI based on the system prompt and the user's input (data).
    // 'await' here tells the code to pause until the AI finishes generating a response.
    const completion = await openai.chat.completions.create({
        // The 'messages' array includes instructions for the AI (systemPrompt) and the user's input (data).
        messages: [
            {
                role: 'system', content: systemPrompt,
            },
            ...data, // The user's data (input) is added here, allowing the AI to respond to it.
        ],
        // Specifies the AI model to use; 'gpt-4o-mini' is a lightweight version of GPT-4.
        model: 'gpt-4o-mini',
        // 'stream: true' means the AI sends the response as it's being created, so the user doesn't have to wait for the whole thing.
        stream: true,
    });

    // This section is responsible for sending the AI's response back to the user, piece by piece.
    // The 'ReadableStream' function is used to send data in small chunks, which is useful for streaming.
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder(); // Converts text into a format the stream can use.
            try {
                // Loop through each chunk (piece) of the AI's response as it's generated.
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content; // Grabs the AI's response text.
                    if (content) {
                        const text = encoder.encode(content); // Encodes the text for the stream.
                        controller.enqueue(text); // Sends the encoded text to the stream, making it available to the user.
                    }
                }
            } catch (err) {
                controller.error(err); // If something goes wrong, this handles the error.
            } finally {
                controller.close(); // Once done, the stream is closed.
            }
        },
    });

    // The function returns the stream response to the user. 
    // This sends the AI's response as it’s being generated, creating a smooth user experience.
    return new NextResponse(stream);
}
