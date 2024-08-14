'use client'

// This is a React component for the frontend of a chat application. 
// The code imports essential UI components from the Material-UI library.

import { Box, Button, Stack, TextField, Typography } from "@mui/material"; // Importing components for layout and styling
import { useState } from "react"; // Importing the useState hook to manage state in the component

// This is the main function that defines our chat component
export default function Home() {
    // Setting up a state variable to hold all the messages in the chat.
    // Initially, it has one message from the 'assistant' (the chatbot).
    const [messages, setMessages] = useState([
        {
            role: 'assistant', // This indicates who sent the message (either 'assistant' or 'user')
            content: 'Hi! I\'m the Headstarter Support Agent, how can I assist you today?' // The text content of the message
        }
    ]);

    // Another state variable to store the current input from the user (initially empty).
    const [message, setMessage] = useState('');

    // A function that handles sending the user's message to the backend server.
    // It also updates the messages array with the user's input and prepares for the assistant's response.
    const sendMessage = async () => {
        // Clear the input field and add the user's message to the messages array.
        setMessage(''); // Clear the input field after sending the message
        setMessages((messages) => [
            ...messages, // Spread the existing messages into a new array
            { role: "user", content: message }, // Add the user's message to the array
            { role: "assistant", content: '' } // Prepare an empty message for the assistant's response
        ]);

        // Send the updated messages array to the server using a POST request.
        const response = fetch('/api/chat', {
            method: 'POST', // Specifies the HTTP method (POST is used for sending data)
            headers: {
                'Content-Type': 'application/json' // Indicates that the data being sent is in JSON format
            },
            body: JSON.stringify([...messages, { role: 'user', content: message }]) // Send the entire conversation history including the new user message
        }).then(async (res) => {
            // Process the response stream from the server (assumes server sends data in chunks).
            const reader = res.body.getReader(); // Get a reader to read the stream of data from the server
            const decoder = new TextDecoder(); // Create a decoder to convert bytes into text

            let result = ''; // Initialize a variable to store the full response text
            return reader.read().then(function processText({ done, value }) {
                if (done) {
                    // If all data has been read, return the accumulated result.
                    return result;
                }
                const text = decoder.decode(value || new Int8Array(), { stream: true }); // Decode the received chunk of data
                setMessages((messages) => {
                    let lastMessage = messages[messages.length - 1]; // Get the last message (which is from the assistant)
                    let otherMessages = messages.slice(0, messages.length - 1); // Get all messages except the last one
                    return ([
                        ...otherMessages, {
                            ...lastMessage, // Spread the last message's properties
                            content: lastMessage.content + text // Append the new text chunk to the assistant's message content
                        }
                    ]);
                });
                // Continue reading the next chunk of data recursively.
                return reader.read().then(processText);
            });
        });
    }

    return (
        // The main container for the chat interface. 
        // 'Box' is a layout component that occupies the entire viewport.
        <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Stack
                direction="column" // Stack elements vertically
                width="600px" // Set the width of the chat window
                height="700px" // Set the height of the chat window
                border="1px solid black" // Add a black border around the chat window
                p={2} // Add padding inside the chat window
                spacing={2} // Set the space between stacked elements
            >
                <Stack
                    direction="column" // Stack messages vertically
                    spacing={2} // Space between messages
                    flexGrow={1} // Allow the message stack to grow and fill the available space
                    overflow="auto" // Enable scrolling when the content overflows the box
                    maxHeight="100%" // Ensure the message stack does not exceed the container's height
                >
                    {
                        // Loop through the 'messages' array and display each message in the chat window
                        messages.map((message, index) => (
                            <Box
                                key={index} // Unique key for each message box, required for efficient rendering
                                display='flex' 
                                justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'} // Align messages to the left if from assistant, to the right if from user
                            >
                                <Box
                                    bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'} // Set the background color: one for the assistant, another for the user
                                    color='white' // Set text color to white
                                    borderRadius={16} // Round the corners of the message box
                                    p={3} // Add padding inside the message box
                                >
                                    <Typography>{message.content}</Typography> 
                                    {/* Display the actual content of the message */}
                                </Box>
                            </Box>
                        ))
                    }
                </Stack>
                <Stack direction="row" spacing={2}>
                    {/* This is where the user types their message */}
                    <TextField
                        label="Message" // Label for the text input field
                        fullWidth // Make the text field take up the full width of the container
                        value={message} // Bind the input value to the 'message' state
                        onChange={(e) => setMessage(e.target.value)} // Update the 'message' state as the user types
                    />

                    {/* This is the button the user clicks to send their message */}
                    <Button variant="contained" onClick={sendMessage}>Ask!</Button>
                </Stack>
            </Stack>
        </Box>
    )
}
