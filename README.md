# Puter AI Chatbot

A simple web application for chatting with multiple AI models simultaneously.

## Features

- Chat with multiple AI models at once
- Compare responses side-by-side
- Image upload and analysis support
- Real-time streaming responses
- Adjustable model parameters

## Supported Models

- GPT-4o
- Claude 3.5 Sonnet
- Gemini 2.0 Flash
- GPT-4o Mini
- And more...

## Quick Start

1. Open `index.html` in your web browser
2. Type your message and click "Send"
3. Watch responses from all models appear simultaneously

## File Structure

```
├── index.html              # Main application
├── styles.css              # Styling
├── js/
│   ├── puterApp.js         # Main app
│   ├── puterUIManager.js   # UI management
│   ├── puterChatManager.js # Chat handling
│   ├── puterModelCapabilities.js # Model definitions
│   └── puterVisionHandler.js     # Image processing
└── README.md              # This file
```

## Usage

- Type messages in the bottom input area
- Upload images by clicking the file input
- Adjust settings using the settings button
- Compare responses across different models

Built with [Puter.js](https://puter.com)