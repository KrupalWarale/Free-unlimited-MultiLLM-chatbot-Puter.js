<div align="center">
  <h1><b>Puter Multi-LLM + Uni LLM AI Chatbot</b></h1>
</div>





<p align="center">
  <img src="https://github-readme-stats.vercel.app/api/pin/?username=KrupalWarale&repo=Free-unlimited-MultiLLM-chatbot-Puter.js&theme=radical" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/KrupalWarale/Free-unlimited-MultiLLM-chatbot-Puter.js?style=social" />
  <img src="https://img.shields.io/github/forks/KrupalWarale/Free-unlimited-MultiLLM-chatbot-Puter.js?style=social" />
</p>



This repository contains a powerful, free, and unlimited multi-LLM chatbot built entirely with front-end technologies using **Puter.js**. Chat with over 35 of the world's leading AI models simultaneously, compare their responses in real-time, and switch seamlessly between a multi-model grid and a focused single-chat experience. No backend, no API keys, no setup required.

## Features

*   **Massive Multi-LLM Comparison**: Chat with over 35 models at once in an "All-in-One" grid view.
*   **Single Chat Mode**: Focus on a conversation with a single, selectable large language model.
*   **Real-Time Streaming**: Watch responses from all models generate simultaneously.
*   **Image Support**: Upload images for analysis with vision-capable models.
*   **Customizable Parameters**: Adjust `Max Tokens` and `Temperature` for all models from the settings panel.
*   **Model Management**: Enable or disable individual models in the grid from the settings panel.
*   **Responsive Design**: A clean, modern UI that works seamlessly on desktop and mobile devices.
*   **Zero Backend**: Runs entirely in the browser thanks to the Puter.js platform.

## Supported Models

This chatbot provides access to a vast array of models, including:

*   **OpenAI**: GPT-4o, GPT-4o Mini, GPT-5 series
*   **Anthropic**: Claude 3.5 Sonnet, Claude Opus 4
*   **Google**: Gemini 2.0 Flash, Gemini 1.5 Flash, Gemma 2
*   **Meta**: Llama 3.1 (8B, 70B, 405B)
*   **Mistral**: Mistral Large, Pixtral, Codestral
*   **And over 20 more!**

## Quick Start

Since this is a client-side application, you can run it directly in your browser.

**Option 1: Open the HTML file**

1.  Clone this repository:
    ```bash
    git clone https://github.com/KrupalWarale/Free-unlimited-MultiLLM-chatbot-Puter.js.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd Free-unlimited-MultiLLM-chatbot-Puter.js
    ```
3.  Open the `index.html` file in a modern web browser (like Chrome, Firefox, or Edge).

**Option 2: Run with the local server**

1.  Ensure you have [Node.js](https://nodejs.org/) installed.
2.  Clone the repository and navigate into the directory.
3.  Start the local server:
    ```bash
    node server.js / npm start / npm run dev / python -m http.server 8000
    ```
4.  Open your browser and go to `http://localhost:3000`.

## How to Use

1.  **Select a Mode**: Use the left sidebar to switch between `All-in-One Chat` (grid view) and `Single LLM Chat`.
2.  **Send a Message**: Type your prompt in the input area at the bottom. Use `Shift+Enter` for a new line. Click "Send" or press `Ctrl+Enter` to submit.
3.  **Upload Images**: Click the file icon in the input area to select one or more images for vision-capable models.
4.  **Adjust Settings**: Click the settings icon in the sidebar to open the settings panel. Here you can:
    *   Adjust `Max Tokens` and `Temperature`.
    *   Toggle individual AI models on or off for the grid view.
5.  **Toggle Sidebar**: On smaller screens, use the hamburger menu to expand or collapse the sidebar.

## Project Structure

```
.
├── index.html              # The main HTML file for the application
├── styles.css              # All CSS styles for the UI
├── manifest.json           # Web app manifest for PWA capabilities
├── package.json            # Project metadata and scripts
├── server.js               # A simple Node.js server for local development
└── js/
    ├── puterApp.js         # Main application entry point and orchestrator
    ├── puterUIManager.js   # Handles all UI rendering and interactions
    ├── puterChatManager.js # Manages communication with Puter.js AI APIs for the grid view
    ├── puterSingleChatManager.js # Manages logic for the single LLM chat mode
    └── puterModelCapabilities.js # Defines all supported models and their configurations
```

## Built With

*   [**Puter.js**](https://puter.com/) - The core platform providing the AI capabilities and making this zero-backend project possible.

## Made By Krupal 



<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=KrupalWarale&show_icons=true&count_private=true&theme=radical" />
</p>








