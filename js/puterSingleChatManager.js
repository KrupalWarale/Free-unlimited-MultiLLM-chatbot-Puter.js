/**
 * Puter Single Chat Manager
 * Handles single LLM chat functionality
 */

class PuterSingleChatManager {
    constructor() {
        this.currentModel = null;
        this.chatHistory = [];
        this.isProcessing = false;
        this.elements = {
            container: null,
            modelSelect: null,
            messagesContainer: null,
            messageInput: null,
            sendButton: null
        };
    }

    /**
     * Initialize the single chat manager
     */
    init() {
        this.bindElements();
        this.bindEvents();
        this.populateModelSelect();
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.elements.container = document.getElementById('singleChatContainer');
        this.elements.modelSelect = document.getElementById('singleModelSelect');
        this.elements.messagesContainer = document.getElementById('singleChatMessages');
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.sendButton = document.getElementById('streamButton');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Model selection change
        if (this.elements.modelSelect) {
            this.elements.modelSelect.addEventListener('change', (e) => {
                this.handleModelChange(e.target.value);
            });
        }
    }

    /**
     * Populate model select dropdown with text-based models only
     */
    populateModelSelect() {
        if (!this.elements.modelSelect || !window.puterModelCapabilities) {
            setTimeout(() => this.populateModelSelect(), 500);
            return;
        }

        try {
            const allModels = puterModelCapabilities.getAllModels();
            const textModels = [];

            // Filter for text-based chat models only (include image generation models now)
            for (const [modelId, model] of Object.entries(allModels)) {
                if (model.type === 'chat' && model.supports.text) {
                    textModels.push({ id: modelId, model: model });
                }
            }

            // Sort models by name
            textModels.sort((a, b) => a.model.name.localeCompare(b.model.name));

            // Clear existing options
            this.elements.modelSelect.innerHTML = '<option value="">Select a model...</option>';

            // Add model options
            textModels.forEach(({ id, model }) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = model.name;
                this.elements.modelSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error populating model select:', error);
            this.elements.modelSelect.innerHTML = '<option value="">Error loading models</option>';
        }
    }

    /**
     * Handle model selection change
     */
    handleModelChange(modelId) {
        if (!modelId) {
            this.currentModel = null;
            this.showWelcomeMessage();
            return;
        }

        this.currentModel = modelId;
        this.clearChat();
        this.showModelSelectedMessage(modelId);
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        this.elements.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h3>💬 Single LLM Chat</h3>
                <p>Select a model above to start chatting one-on-one with your chosen AI assistant.</p>
            </div>
        `;
    }

    /**
     * Show model selected message
     */
    showModelSelectedMessage(modelId) {
        const model = puterModelCapabilities.getModel(modelId);
        if (!model) return;

        this.elements.messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h3>🤖 ${model.name}</h3>
                <p>You're now chatting with ${model.name}. Start typing your message below!</p>
            </div>
        `;
    }

    /**
     * Clear chat history and UI
     */
    clearChat() {
        this.chatHistory = [];
        this.elements.messagesContainer.innerHTML = '';
    }

    /**
     * Send message to selected model
     */
    async sendMessage(message) {
        if (!this.currentModel) {
            this.showError('Please select a model first');
            return;
        }

        if (!message.trim()) {
            this.showError('Please enter a message');
            return;
        }

        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            // Clear welcome message if present
            const welcomeMessage = this.elements.messagesContainer.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }

            // Display user message
            this.displayUserMessage(message);

            // Add to chat history
            this.chatHistory.push({ role: 'user', content: message });

            // Show typing indicator
            const typingIndicator = this.showTypingIndicator();

            // Get model and send message
            const model = puterModelCapabilities.getModel(this.currentModel);
            if (!model) {
                throw new Error('Selected model not found');
            }

            // Prepare messages for API
            const messages = [
                {
                    role: "system",
                    content: `You are ${model.name}. Always identify yourself correctly as ${model.name} when asked about your identity. Do not claim to be ChatGPT or any other model.`
                },
                ...this.chatHistory
            ];

            let response;
            try {
                // Try streaming first
                response = await puter.ai.chat(messages, { 
                    ...model.parameters, 
                    stream: true 
                });
                
                if (response && typeof response[Symbol.asyncIterator] === 'function') {
                    // Remove typing indicator
                    if (typingIndicator) {
                        typingIndicator.remove();
                    }
                    
                    await this.handleStreamingResponse(response);
                    return;
                }
            } catch (e) {
                console.log('Streaming failed, trying direct response:', e.message);
            }

            // Fallback to direct response
            try {
                response = await puter.ai.chat(messages, model.parameters);
            } catch (e) {
                // Final fallback with simple message
                const systemMessage = `You are ${model.name}. Always identify yourself correctly as ${model.name} when asked about your identity.`;
                const fullMessage = `${systemMessage}\n\nUser: ${message}`;
                response = await puter.ai.chat(fullMessage, model.parameters);
            }

            // Remove typing indicator
            if (typingIndicator) {
                typingIndicator.remove();
            }

            // Extract and display response
            const content = this.extractContentFromResponse(response);
            this.displayAssistantMessage(content);

            // Add to chat history
            this.chatHistory.push({ role: 'assistant', content: content });

        } catch (error) {
            console.error('Error sending message:', error);
            
            // Remove typing indicator
            const typingIndicator = this.elements.messagesContainer.querySelector('.single-typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            this.displayAssistantMessage(`Error: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle streaming response
     */
    async handleStreamingResponse(response) {
        let fullContent = '';
        let messageDiv = null;

        try {
            // Create initial message div
            messageDiv = this.displayAssistantMessage('');

            for await (const part of response) {
                if (part?.text) {
                    fullContent += part.text;
                    
                    // Update the message content
                    if (messageDiv) {
                        const contentDiv = messageDiv.querySelector('.single-message-content');
                        if (contentDiv) {
                            contentDiv.innerHTML = this.formatContent(fullContent);
                        }
                    }
                    
                    // Scroll to bottom
                    this.scrollToBottom();
                }
            }

            // Add to chat history
            this.chatHistory.push({ role: 'assistant', content: fullContent });

        } catch (error) {
            console.error('Streaming error:', error);
            if (messageDiv) {
                const contentDiv = messageDiv.querySelector('.single-message-content');
                if (contentDiv) {
                    contentDiv.innerHTML = `Error: ${error.message}`;
                }
            }
        }
    }

    /**
     * Display user message
     */
    displayUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'single-message user';
        
        messageDiv.innerHTML = `
            <div class="single-message-header">
                <span>You</span>
            </div>
            <div class="single-message-content">${this.formatContent(message)}</div>
        `;
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Display assistant message
     */
    displayAssistantMessage(content) {
        const model = puterModelCapabilities.getModel(this.currentModel);
        const modelName = model ? model.name : 'AI Assistant';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'single-message assistant';
        
        messageDiv.innerHTML = `
            <div class="single-message-header">
                <span class="model-badge">${modelName}</span>
            </div>
            <div class="single-message-content">${this.formatContent(content)}</div>
        `;
        
        this.elements.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'single-typing-indicator';
        
        typingDiv.innerHTML = `
            <div class="single-typing-dots">
                <div class="single-typing-dot"></div>
                <div class="single-typing-dot"></div>
                <div class="single-typing-dot"></div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        
        return typingDiv;
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
     * Format content for display
     */
    formatContent(content) {
        if (!content) return '';
        
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        if (this.elements.messagesContainer) {
            this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 14px;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }

    /**
     * Show single chat interface
     */
    show() {
        if (this.elements.container) {
            this.elements.container.style.display = 'flex';
        }
        
        // Hide multi-chat interface
        const chatGridContainer = document.querySelector('.chat-grid-container');
        if (chatGridContainer) {
            chatGridContainer.style.display = 'none';
        }
    }

    /**
     * Hide single chat interface
     */
    hide() {
        if (this.elements.container) {
            this.elements.container.style.display = 'none';
        }
        
        // Show multi-chat interface
        const chatGridContainer = document.querySelector('.chat-grid-container');
        if (chatGridContainer) {
            chatGridContainer.style.display = 'block';
        }
    }

    /**
     * Check if currently active
     */
    isActive() {
        return this.elements.container && this.elements.container.style.display !== 'none';
    }
}

// Create global instance
window.puterSingleChatManager = new PuterSingleChatManager();