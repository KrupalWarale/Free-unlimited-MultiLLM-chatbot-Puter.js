/**
 * Puter Chat Manager
 * Handles communication with Puter AI services
 */

class PuterChatManager {
    constructor() {
        this.currentStreamingMessage = null;
    }

    /**
     * Send message to all specified models
     */
    async sendMessageToAllModels(message, images = [], modelIds = []) {

        // Send to each model concurrently
        const promises = modelIds.map(modelId => this.sendMessageToModel(message, images, modelId));
        
        try {
            await Promise.allSettled(promises);
        } catch (error) {
            console.error('Error sending to models:', error);
        }
    }

    /**
     * Get all available chat models (excluding image generation models)
     */
    getAllChatModels() {
        const allModels = puterModelCapabilities.getAllModels();
        const chatModels = [];
        
        for (const [modelId, model] of Object.entries(allModels)) {
            // Include only chat models that support text, exclude image generation models
            if (model.type === 'chat' && model.supports.text) {
                chatModels.push(modelId);
            }
        }
        
        return chatModels;
    }

    /**
     * Send message to a specific model
     */
    async sendMessageToModel(message, images = [], modelId) {
        try {
            // Show typing indicator
            puterUIManager.showTypingIndicator(modelId);

            // Get model configuration
            const model = puterModelCapabilities.getModel(modelId);
            if (!model) {
                throw new Error(`Model ${modelId} not found`);
            }

            let response;

            if (images.length > 0) {
                // Images not supported - show error message
                response = `❌ Image analysis is not supported in this version.`;
            } else {
                // Handle text chat
                // Create proper messages array with system message
                const messages = [
                    {
                        role: "system",
                        content: `You are ${model.name}. Always identify yourself correctly as ${model.name} when asked about your identity. Do not claim to be ChatGPT or any other model.`
                    },
                    {
                        role: "user", 
                        content: message
                    }
                ];
                
                try {
                    // Try streaming first with messages array
                    const streamResponse = await puter.ai.chat(messages, { 
                        ...model.parameters, 
                        stream: true 
                    });
                    
                    if (streamResponse && typeof streamResponse[Symbol.asyncIterator] === 'function') {
                        await this.handleStreamingResponseForModel(streamResponse, modelId);
                        return;
                    }
                } catch (e) {
                    // Try fallback approaches
                    
                    // Fallback 1: Try with simple message + system instruction
                    try {
                        const systemMessage = `You are ${model.name}. Always identify yourself correctly as ${model.name} when asked about your identity. Do not claim to be ChatGPT or any other model.`;
                        const fullMessage = `${systemMessage}\n\nUser: ${message}`;
                        
                        const streamResponse2 = await puter.ai.chat(fullMessage, { 
                            ...model.parameters, 
                            stream: true 
                        });
                        
                        if (streamResponse2 && typeof streamResponse2[Symbol.asyncIterator] === 'function') {
                            await this.handleStreamingResponseForModel(streamResponse2, modelId);
                            return;
                        }
                    } catch (e2) {
                        // Use direct response as final fallback
                    }
                }

                // Direct response fallback - try messages array first
                try {
                    response = await puter.ai.chat(messages, model.parameters);
                } catch (e) {
                    // Final fallback: simple message with system instruction
                    const systemMessage = `You are ${model.name}. Always identify yourself correctly as ${model.name} when asked about your identity. Do not claim to be ChatGPT or any other model.`;
                    const fullMessage = `${systemMessage}\n\nUser: ${message}`;
                    response = await puter.ai.chat(fullMessage, model.parameters);
                }
            }

            // Remove typing indicator and display response
            puterUIManager.removeTypingIndicator(modelId);
            this.displayResponseForModel(response, modelId);

        } catch (error) {
            console.error(`Error with model ${modelId}:`, error);
            puterUIManager.removeTypingIndicator(modelId);
            puterUIManager.displayAssistantMessage(modelId, `Error: ${error.message}`);
        }
    }

    /**
     * Handle streaming response for a specific model
     */
    async handleStreamingResponseForModel(response, modelId) {
        let fullContent = '';
        let messageDiv = null;

        try {
            // Remove typing indicator
            puterUIManager.removeTypingIndicator(modelId);
            
            // Create initial message div
            messageDiv = puterUIManager.displayAssistantMessage(modelId, '');

            for await (const part of response) {
                if (part?.text) {
                    fullContent += part.text;
                    
                    // Update the message content
                    if (messageDiv) {
                        const contentDiv = messageDiv.querySelector('.message-content');
                        if (contentDiv) {
                            contentDiv.innerHTML = puterUIManager.formatContent(fullContent);
                        }
                    }
                    
                    // Scroll to bottom
                    puterUIManager.scrollToBottom(modelId);
                }
            }

        } catch (error) {
            console.error(`Streaming error for ${modelId}:`, error);
            if (messageDiv) {
                const contentDiv = messageDiv.querySelector('.message-content');
                if (contentDiv) {
                    contentDiv.innerHTML = `Error: ${error.message}`;
                }
            }
        }
    }

    /**
     * Display response for a specific model
     */
    displayResponseForModel(response, modelId) {
        let content = this.extractContentFromResponse(response);
        puterUIManager.displayAssistantMessage(modelId, content);
        puterUIManager.scrollToBottom(modelId);
    }

    /**
     * Extract content from various response formats
     */
    extractContentFromResponse(response) {
        if (typeof response === 'string') {
            return response;
        } else if (response?.message?.content) {
            return response.message.content;
        } else if (response?.toString && typeof response.toString === 'function') {
            return response.toString();
        } else if (Array.isArray(response) && response[0]?.text) {
            return response.map(item => item.text || item.content || '').join('');
        } else if (Array.isArray(response) && response[0]?.type === 'text' && response[0]?.text) {
            return response[0].text;
        } else if (response?.content) {
            return response.content;
        } else if (response?.text) {
            return response.text;
        } else if (response?.choices && response.choices[0]?.message?.content) {
            return response.choices[0].message.content;
        } else if (response?.data?.content) {
            return response.data.content;
        } else if (response?.data?.text) {
            return response.data.text;
        } else if (response?.message) {
            return response.message;
        } else if (response?.response) {
            return response.response;
        } else {
            console.warn('Unknown response format:', response);
            return `Received response but could not extract text content. Response type: ${typeof response}`;
        }
    }

    /**
     * Handle chat messages (text only)
     */
    async handleChatMessage(message, images, useStreaming, model) {
        try {
            let response;

            if (images.length > 0) {
                // Images not supported - show helpful message
                return;
            } else {
                // Handle text chat

                // Create proper messages array with system message
                const modelName = model?.name || 'AI Assistant';
                const messages = [
                    {
                        role: "system",
                        content: `You are ${modelName}. Always identify yourself correctly as ${modelName} when asked about your identity. Do not claim to be ChatGPT or any other model.`
                    },
                    {
                        role: "user", 
                        content: message
                    }
                ];

                if (useStreaming) {
                    try {
                        // Try messages array first
                        response = await puter.ai.chat(messages, { stream: true });
                        if (response && typeof response[Symbol.asyncIterator] === 'function') {
                            await this.handleStreamingResponse(response, model);
                            return;
                        }
                    } catch (e) {
                        // Try fallback streaming approach
                        try {
                            // Fallback: simple message with system instruction
                            const systemMessage = `You are ${modelName}. Always identify yourself correctly as ${modelName} when asked about your identity. Do not claim to be ChatGPT or any other model.`;
                            const fullMessage = `${systemMessage}\n\nUser: ${message}`;
                            response = await puter.ai.chat(fullMessage, { stream: true });
                            if (response && typeof response[Symbol.asyncIterator] === 'function') {
                                await this.handleStreamingResponse(response, model);
                                return;
                            }
                        } catch (e2) {
                            // Use direct response as final fallback
                        }
                    }
                }

                // Direct response - try messages array first
                try {
                    response = await puter.ai.chat(messages);
                } catch (e) {
                    // Fallback: simple message with system instruction
                    const systemMessage = `You are ${modelName}. Always identify yourself correctly as ${modelName} when asked about your identity. Do not claim to be ChatGPT or any other model.`;
                    const fullMessage = `${systemMessage}\n\nUser: ${message}`;
                    response = await puter.ai.chat(fullMessage);
                }
                this.displayChatResponse(response, model);
            }

        } catch (error) {
            throw new Error(`Chat failed: ${error.message}`);
        }
    }



    /**
     * Handle streaming response
     */
    async handleStreamingResponse(response, model = null) {
        let streamingMessageDiv;
        let fullContent = '';

        try {
            // Create initial message div
            streamingMessageDiv = puterUIManager.displayAssistantMessage(model?.id || 'unknown', '');

            for await (const part of response) {
                if (part?.text) {
                    fullContent += part.text;
                    
                    // Update the message content
                    if (streamingMessageDiv) {
                        const contentDiv = streamingMessageDiv.querySelector('.message-content');
                        if (contentDiv) {
                            contentDiv.innerHTML = puterUIManager.formatContent(fullContent);
                        }
                    }
                    
                    // Scroll to bottom
                    if (model?.id) {
                        puterUIManager.scrollToBottom(model.id);
                    }
                }
            }

        } catch (error) {
            console.error(`Streaming error:`, error);
            if (streamingMessageDiv) {
                const contentDiv = streamingMessageDiv.querySelector('.message-content');
                if (contentDiv) {
                    contentDiv.innerHTML = `Error: ${error.message}`;
                }
            }
            throw new Error(`Streaming failed: ${error.message}`);
        }
    }



    /**
     * Display regular chat response
     */
    displayChatResponse(response, model = null) {
        let content;

        // Extract content from response

        if (typeof response === 'string') {
            content = response;
        } else if (response?.message?.content) {
            // Direct message.content (GPT-4 format)
            content = response.message.content;
        } else if (response?.toString && typeof response.toString === 'function') {
            // Try toString method for various response formats
            content = response.toString();
        } else if (Array.isArray(response) && response[0]?.text) {
            // Claude format: array with text objects
            content = response.map(item => item.text || item.content || '').join('');
        } else if (Array.isArray(response) && response[0]?.type === 'text' && response[0]?.text) {
            // Claude format: array with type/text objects
            content = response[0].text;
        } else if (response?.content) {
            content = response.content;
        } else if (response?.text) {
            content = response.text;
        } else if (response?.choices && response.choices[0]?.message?.content) {
            // OpenAI-style response format with choices array
            content = response.choices[0].message.content;
        } else if (response?.data?.content) {
            content = response.data.content;
        } else if (response?.data?.text) {
            content = response.data.text;
        } else if (response?.message) {
            content = response.message;
        } else if (response?.response) {
            content = response.response;
        } else {
            // Handle unknown response format
            console.warn('⚠️ Unknown response format:', response);

            // Check if response has any string properties we can use
            const stringProps = Object.keys(response || {}).filter(key =>
                typeof response[key] === 'string' && response[key].length > 0
            );

            if (stringProps.length > 0) {
                content = response[stringProps[0]];
            } else {
                // If it's an object, try to convert it to a readable format
                if (typeof response === 'object' && response !== null) {
                    // Look for common patterns in nested objects
                    const flattenObject = (obj, prefix = '') => {
                        let result = [];
                        for (const [key, value] of Object.entries(obj)) {
                            if (typeof value === 'string' && value.length > 0) {
                                result.push(`${prefix}${key}: ${value}`);
                            } else if (typeof value === 'object' && value !== null) {
                                result.push(...flattenObject(value, `${prefix}${key}.`));
                            }
                        }
                        return result;
                    };

                    const flattenedData = flattenObject(response);
                    if (flattenedData.length > 0) {
                        content = flattenedData.join('\n');
                    } else {
                        content = `Received response object with keys: ${Object.keys(response).join(', ')}. Full response logged to console.`;
                    }
                } else {
                    content = `Received response but could not extract text content. Response type: ${typeof response}. Keys: ${Object.keys(response || {}).join(', ')}`;
                }
            }
        }

        // Content extracted successfully

        // Display the response
        if (model?.id) {
            puterUIManager.displayAssistantMessage(model.id, content);
        }
    }



    /**
     * Handle errors and provide helpful feedback
     */
    handleError(error, context = '') {
        console.error(`Puter Chat Manager Error ${context}:`, error);

        let userMessage = 'An error occurred. ';

        if (error.message.includes('rate limit')) {
            userMessage += 'You\'ve reached the rate limit. Please wait a moment before trying again.';
        } else if (error.message.includes('authentication')) {
            userMessage += 'Authentication failed. Please refresh the page and try again.';
        } else if (error.message.includes('network')) {
            userMessage += 'Network connection issue. Please check your internet connection.';
        } else if (error.message.includes('model')) {
            userMessage += 'The selected model is currently unavailable. Try switching to another model.';
        } else {
            userMessage += error.message || 'Please try again or contact support if the issue persists.';
        }

        puterUIManager.showError(userMessage);
    }
}

// Create global instance
window.puterChatManager = new PuterChatManager();
