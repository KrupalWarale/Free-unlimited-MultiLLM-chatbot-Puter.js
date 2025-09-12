/**
 * Puter UI Manager
 * Handles all UI interactions and dynamic interface updates
 */



class PuterUIManager {
    constructor() {
        this.elements = {
            messageInput: null,
            fileInput: null,
            sendButton: null,
            toggleParams: null,
            toggleSidebar: null,
            maxTokensInput: null,
            temperatureInput: null,
            settingsSidebar: null,
            closeSidebarButton: null,
            modelItems: null,
            sidebar: null
        };

        this.activeModels = []; // Will be populated with all available models
        this.uploadedImages = [];
        this.isProcessing = false;
        this.chatWindows = new Map(); // Store chat window elements
        this.modelStates = new Map(); // Store model enabled/disabled states

        // Add property to track single chat container
        this.singleChatContainer = null;
    }

    /**
     * Initialize the UI manager
     */
    init() {
        // Check if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }
        
        try {
            this.bindElements();
            this.bindEvents();
            this.bindMobileEvents();
            this.updateUI();
            this.updateSendButtonState();
            this.showWelcomeMessage();

            // Initialize chat windows
            this.initializeChatWindows();

            // Initialize responsive grid
            this.initResponsiveGrid();

            // Initialize single chat manager
            if (window.puterSingleChatManager) {
                window.puterSingleChatManager.init();
            }

            // Cache single chat container element
            this.singleChatContainer = document.querySelector('.single-chat-container');
        } catch (error) {
            console.error('❌ Error during PuterUIManager initialization:', error);
            throw error;
        }
    }

    /**
     * Initialize chat windows
     */
    initializeChatWindows() {
        this.generateAllChatWindows();
        // Generate settings model toggles after a delay to ensure chat windows are ready
        setTimeout(() => {
            this.generateSettingsModelToggles();
        }, 1000);
    }

    /**
     * Show single chat interface
     */
    showSingleChat() {
        if (!this.singleChatContainer) {
            this.singleChatContainer = document.querySelector('.single-chat-container');
        }
        if (this.singleChatContainer) {
            this.singleChatContainer.style.display = 'flex';
        }
        const chatGridContainer = document.querySelector('.chat-grid-container');
        if (chatGridContainer) {
            chatGridContainer.style.display = 'none';
        }
    }

    /**
     * Hide single chat interface
     */
    hideSingleChat() {
        if (this.singleChatContainer) {
            this.singleChatContainer.style.display = 'none';
        }
        const chatGridContainer = document.querySelector('.chat-grid-container');
        if (chatGridContainer) {
            chatGridContainer.style.display = 'block';
        }
    }

    /**
     * Hide all multi-chat windows
     */
    hideAllChatWindows() {
        const chatGridContainer = document.querySelector('.chat-grid-container');
        if (chatGridContainer) {
            chatGridContainer.style.display = 'none';
        }
    }

    /**
     * Generate all chat windows dynamically
     */
    generateAllChatWindows() {
        const chatGrid = document.getElementById('chatGrid');
        if (!chatGrid) {
            console.warn('❌ Chat grid element not found');
            return;
        }

        // Check if dependencies are available
        if (!window.puterChatManager) {
            console.warn('❌ Chat manager not available, retrying in 500ms...');
            setTimeout(() => this.generateAllChatWindows(), 500);
            return;
        }

        if (!window.puterModelCapabilities) {
            console.warn('❌ Model capabilities not available, retrying in 500ms...');
            setTimeout(() => this.generateAllChatWindows(), 500);
            return;
        }

        try {
            // Get all available chat models
            const allModels = puterChatManager.getAllChatModels();

        // Clear existing windows and loading indicator
        chatGrid.innerHTML = '';
        this.chatWindows.clear();

        // Calculate grid layout for 35 models - use 3 columns for optimal display
        const modelCount = allModels.length;
        const cols = 3; // Fixed layout for 35 models
        
        // Set the grid layout with important to override CSS
        chatGrid.style.setProperty('grid-template-columns', `repeat(${cols}, 1fr)`, 'important');
        chatGrid.style.setProperty('grid-template-rows', 'auto', 'important');

        // Create chat windows for all models
        allModels.forEach(modelId => {
            const model = puterModelCapabilities.getModel(modelId);
            if (!model) return;

            // Initialize model state as enabled by default
            this.modelStates.set(modelId, true);

            const chatWindow = document.createElement('div');
            chatWindow.className = 'chat-window';
            chatWindow.setAttribute('data-model', modelId);

            chatWindow.innerHTML = `
                <div class="chat-header">
                    <div class="model-info">
                        <div class="model-icon">${this.getModelIcon(modelId)}</div>
                        <span class="model-name" title="${model.name}">${model.name}</span>
                    </div>
                    <div class="model-controls">
                        <button class="model-toggle-btn" data-model="${modelId}" title="Toggle model output">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="chat-messages" id="messages-${modelId}">
                    <div class="placeholder-text">Ready to chat with ${model.name}</div>
                </div>
            `;

            chatGrid.appendChild(chatWindow);
            
            // Store reference to the messages container
            const messagesContainer = chatWindow.querySelector('.chat-messages');
            this.chatWindows.set(modelId, messagesContainer);
            
            // Add toggle button event listener
            const toggleBtn = chatWindow.querySelector('.model-toggle-btn');
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleModelState(modelId);
            });
        });
        } catch (error) {
            console.error('❌ Error generating chat windows:', error);
            // Show error message in the grid
            chatGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; padding: 40px; text-align: center; background: white; border-radius: 8px; margin: 20px; color: #dc3545;">
                    <h3>Error Loading Models</h3>
                    <p>Failed to load AI models: ${error.message}</p>
                    <button onclick="window.puterUIManager.generateAllChatWindows()" style="margin-top: 16px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Bind DOM elements
     */
    bindElements() {
        this.elements.messageInput = document.getElementById('messageInput');
        this.elements.fileInput = document.getElementById('fileInput');
        this.elements.sendButton = document.getElementById('streamButton');
        this.elements.toggleParams = document.getElementById('toggleParams');
        this.elements.toggleSidebar = document.getElementById('toggleSidebar');
        this.elements.maxTokensInput = document.getElementById('maxTokensInput');
        this.elements.temperatureInput = document.getElementById('temperatureInput');
        this.elements.settingsSidebar = document.getElementById('settingsSidebar');
        this.elements.closeSidebarButton = document.querySelector('.close-sidebar');
        this.elements.modelItems = document.querySelectorAll('.model-item');
        this.elements.sidebar = document.querySelector('.sidebar');
        
        // Setup mobile sidebar functionality
        this.mobileBreakpoint = 576;
        this.isMobileView = window.innerWidth <= this.mobileBreakpoint;
        
        // Bind mobile events
        this.bindMobileEvents();
        
        // Initialize responsive grid
        this.initResponsiveGrid();
        
        // Set up resize listener
        this.setupResponsiveHandlers();

        // Initialize chat windows
        this.activeModels.forEach(modelId => {
            const messagesContainer = document.getElementById(`messages-${modelId}`);
            if (messagesContainer) {
                this.chatWindows.set(modelId, messagesContainer);
            }
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Send button
        this.elements.sendButton.addEventListener('click', () => {
            this.handleSend();
        });

        // Enter key in textarea (Shift+Enter for new line)
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        // Model selection in sidebar
        this.elements.modelItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                this.elements.modelItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');
                
                const modelId = item.getAttribute('data-model');
                if (modelId === 'all') {
                    // Show all chat windows in scrollable grid
                    this.showAllChatWindows();
                    this.hideSingleChat();
                } else if (modelId === 'single') {
                    // Show single LLM chat interface
                    this.showSingleChat();
                    this.hideAllChatWindows();
                } else {
                    // Show specific model chat window
                    this.showSingleChatWindow(modelId);
                    this.hideSingleChat();
                }
            });
        });



        // Settings toggle
        this.elements.toggleParams.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.elements.settingsSidebar) {
                this.elements.settingsSidebar.classList.toggle('open');
            }
        });

        // Sidebar toggle
        this.elements.toggleSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleSidebar();
        });

        // Close sidebar button
        if (this.elements.closeSidebarButton) {
            this.elements.closeSidebarButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.elements.settingsSidebar.classList.remove('open');
            });
        }

        // Slider value updates
        this.setupSliderUpdates();


    }

    /**
     * Set up slider value updates
     */
    setupSliderUpdates() {
        // Max tokens slider
        const maxTokensSlider = document.getElementById('maxTokensInput');
        const maxTokensValue = document.getElementById('maxTokensValue');

        if (maxTokensSlider && maxTokensValue) {
            maxTokensSlider.addEventListener('input', (e) => {
                maxTokensValue.textContent = e.target.value;
            });
        }

        // Temperature slider
        const temperatureSlider = document.getElementById('temperatureInput');
        const temperatureValue = document.getElementById('temperatureValue');

        if (temperatureSlider && temperatureValue) {
            temperatureSlider.addEventListener('input', (e) => {
                temperatureValue.textContent = e.target.value;
            });
        }
    }

    /**
     * Toggle model enabled/disabled state
     */
    toggleModelState(modelId) {
        const isEnabled = this.modelStates.get(modelId);
        const newState = !isEnabled;
        this.modelStates.set(modelId, newState);
        
        // Update visual state
        const chatWindow = document.querySelector(`[data-model="${modelId}"]`);
        const toggleBtn = chatWindow.querySelector('.model-toggle-btn');
        
        if (newState) {
            chatWindow.classList.remove('disabled');
            toggleBtn.classList.remove('disabled');
            toggleBtn.title = 'Disable model output';
        } else {
            chatWindow.classList.add('disabled');
            toggleBtn.classList.add('disabled');
            toggleBtn.title = 'Enable model output';
            
            // Clear any ongoing typing indicators
            this.removeTypingIndicator(modelId);
        }
        
        // Update settings panel if it exists
        this.updateSettingsToggle(modelId, newState);
    }

    /**
     * Check if model is enabled
     */
    isModelEnabled(modelId) {
        return this.modelStates.get(modelId) !== false;
    }

    /**
     * Update settings toggle state
     */
    updateSettingsToggle(modelId, isEnabled) {
        const settingsToggle = document.querySelector(`#settings-toggle-${modelId}`);
        if (settingsToggle) {
            settingsToggle.checked = isEnabled;
        }
    }

    /**
     * Generate company-grouped settings panel
     */
    generateSettingsModelToggles() {
        const settingsContent = document.querySelector('.sidebar-content');
        if (!settingsContent) return;

        // Check if model toggles section already exists
        let modelTogglesSection = settingsContent.querySelector('.model-toggles-section');
        if (modelTogglesSection) {
            modelTogglesSection.remove();
        }

        // Create model toggles section
        modelTogglesSection = document.createElement('div');
        modelTogglesSection.className = 'model-toggles-section';
        modelTogglesSection.innerHTML = '<h4>Model Output Control</h4>';

        // Get all chat models and group by company
        const allModels = puterChatManager.getAllChatModels();
        const companiesMap = this.groupModelsByCompany(allModels);

        // Generate company groups
        for (const [company, models] of companiesMap.entries()) {
            const companyGroup = document.createElement('div');
            companyGroup.className = 'company-group';
            
            companyGroup.innerHTML = `
                <div class="company-header">
                    <h5>${company}</h5>
                </div>
                <div class="company-models">
                    ${models.map(modelId => {
                        const model = puterModelCapabilities.getModel(modelId);
                        const isEnabled = this.isModelEnabled(modelId);
                        return `
                            <div class="model-toggle-item">
                                <label class="toggle-label" for="settings-toggle-${modelId}">
                                    <span class="model-name">${model.name}</span>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="settings-toggle-${modelId}" ${isEnabled ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </div>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            modelTogglesSection.appendChild(companyGroup);
        }

        // Add event listeners for settings toggles
        setTimeout(() => {
            modelTogglesSection.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
                toggle.addEventListener('change', (e) => {
                    const modelId = e.target.id.replace('settings-toggle-', '');
                    const isEnabled = e.target.checked;
                    this.modelStates.set(modelId, isEnabled);
                    this.updateChatWindowToggle(modelId, isEnabled);
                });
            });
        }, 100);

        // Add to settings content
        settingsContent.appendChild(modelTogglesSection);
    }

    /**
     * Group models by company name
     */
    groupModelsByCompany(modelIds) {
        const companiesMap = new Map();

        modelIds.forEach(modelId => {
            const company = this.getModelCompany(modelId);
            if (!companiesMap.has(company)) {
                companiesMap.set(company, []);
            }
            companiesMap.get(company).push(modelId);
        });

        // Sort companies alphabetically
        return new Map([...companiesMap.entries()].sort());
    }

    /**
     * Get company name for a model
     */
    getModelCompany(modelId) {
        // Map model IDs to company names
        if (modelId.startsWith('gpt-') || modelId.startsWith('o1') || modelId.startsWith('o3') || modelId.startsWith('o4')) {
            return 'OpenAI';
        } else if (modelId.startsWith('claude')) {
            return 'Anthropic';
        } else if (modelId.startsWith('gemini')) {
            return 'Google';
        } else if (modelId.startsWith('deepseek')) {
            return 'DeepSeek';
        } else if (modelId.startsWith('meta-llama')) {
            return 'Meta';
        } else if (modelId.startsWith('mistral') || modelId.startsWith('pixtral') || modelId.startsWith('codestral')) {
            return 'Mistral';
        } else if (modelId.startsWith('grok')) {
            return 'xAI';
        } else if (modelId.includes('gemma')) {
            return 'Google';
        } else {
            return 'Other';
        }
    }

    /**
     * Update chat window toggle state from settings
     */
    updateChatWindowToggle(modelId, isEnabled) {
        const chatWindow = document.querySelector(`[data-model="${modelId}"]`);
        const toggleBtn = chatWindow?.querySelector('.model-toggle-btn');
        
        if (chatWindow && toggleBtn) {
            if (isEnabled) {
                chatWindow.classList.remove('disabled');
                toggleBtn.classList.remove('disabled');
                toggleBtn.title = 'Disable model output';
            } else {
                chatWindow.classList.add('disabled');
                toggleBtn.classList.add('disabled');
                toggleBtn.title = 'Enable model output';
                
                // Clear any ongoing typing indicators
                this.removeTypingIndicator(modelId);
            }
        }
    }





    /**
     * Handle file upload
     */
    async handleFileUpload(files) {
        const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (validFiles.length === 0) {
            this.showError('Please select valid image files (JPG, PNG, GIF, WebP)');
            return;
        }

        // Show upload progress for multiple files
        if (validFiles.length > 1) {
            this.showMessage(`Uploading ${validFiles.length} images...`, 'system');
        }

        for (const file of validFiles) {
            try {
                // Check file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    this.showError(`${file.name} is too large. Maximum size is 10MB.`);
                    continue;
                }

                const imageUrl = await this.fileToBase64(file);
                this.uploadedImages.push({
                    file: file,
                    url: imageUrl,
                    name: file.name
                });
                this.displayUploadedImage(imageUrl, file.name);
            } catch (error) {
                this.showError(`Failed to upload ${file.name}: ${error.message}`);
            }
        }

        // Update send button state after upload
        this.updateSendButtonState();
        
        // Clear the file input so user can select the same files again if needed
        this.elements.fileInput.value = '';
    }

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Display uploaded image in UI
     */
    displayUploadedImage(imageUrl, fileName) {
        // For the new multi-chat interface, we'll show image previews in the input area
        console.log('📷 Image uploaded:', fileName);
        // Images will be displayed when the message is sent to all chat windows
    }

    /**
     * Remove uploaded image
     */
    removeImage(fileName) {
        this.uploadedImages = this.uploadedImages.filter(img => img.name !== fileName);

        const previews = document.querySelectorAll('.image-preview');
        previews.forEach(preview => {
            if (preview.querySelector('.image-name').textContent === fileName) {
                preview.style.opacity = '0';
                preview.style.transform = 'scale(0.8)';
                setTimeout(() => preview.remove(), 200);
            }
        });

        // Update send button state after removal
        this.updateSendButtonState();
    }

    /**
     * Show system message
     */
    showMessage(content, type = 'system') {
        // For the new multi-chat interface, system messages are shown as notifications
        
        if (type === 'system') {
            // Show as a temporary notification
            this.showNotification(content);
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
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.opacity = '0';
                errorDiv.style.transform = 'translateX(100%)';
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 3000);
    }

    /**
     * Show temporary notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }



    /**
     * Handle send button click
     */
    async handleSend() {
        if (this.isProcessing) return;

        const message = this.elements.messageInput.value.trim();
        const hasImages = this.uploadedImages.length > 0;

        if (!message && !hasImages) {
            this.showError('Please enter a message or upload an image');
            return;
        }

        this.isProcessing = true;
        this.setSendButtonLoading(true);

        try {
            // Check if single chat mode is active
            if (window.puterSingleChatManager && window.puterSingleChatManager.isActive()) {
                // Handle single chat mode
                await window.puterSingleChatManager.sendMessage(message);
                
                // Clear input
                this.elements.messageInput.value = '';
                this.autoResizeTextarea();
            } else {
                // Handle multi-chat mode
                const activeModelItem = document.querySelector('.model-item.active');
                const selectedModel = activeModelItem ? activeModelItem.getAttribute('data-model') : 'all';
                
                let modelsToUse = [];
                if (selectedModel === 'all') {
                    // Get all available chat models
                    modelsToUse = puterChatManager.getAllChatModels();
                } else {
                    // Use only the selected model
                    modelsToUse = [selectedModel];
                }

                // Display user message in all active chat windows
                this.displayUserMessageInAllWindows(message, this.uploadedImages, modelsToUse);

                // Clear input and images
                this.elements.messageInput.value = '';
                const imagesToSend = [...this.uploadedImages];
                this.uploadedImages = [];
                this.elements.fileInput.value = '';

                // Send to selected models
                await puterChatManager.sendMessageToAllModels(message, imagesToSend, modelsToUse);
            }

        } catch (error) {
            this.showError(`Failed to send message: ${error.message}`);
        } finally {
            this.isProcessing = false;
            this.setSendButtonLoading(false);
            // Ensure button state is properly updated after sending
            setTimeout(() => {
                this.updateSendButtonState();
            }, 100);
        }
    }

    /**
     * Display user message in all chat windows
     */
    displayUserMessageInAllWindows(message, images = [], modelsToUse = null) {
        const models = modelsToUse || this.activeModels;
        
        models.forEach(modelId => {
            const chatWindow = this.chatWindows.get(modelId);
            if (chatWindow) {
                // Remove placeholder text
                const placeholder = chatWindow.querySelector('.placeholder-text');
                if (placeholder) {
                    placeholder.remove();
                }

                // Create user message
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message user';
                
                let html = '';
                if (images && images.length > 0) {
                    html += '<div class="message-images">';
                    images.forEach(img => {
                        html += `<img src="${img.url}" alt="${img.name}" class="message-image" style="max-width: 200px; border-radius: 8px; margin: 4px;">`;
                    });
                    html += '</div>';
                }
                
                if (message) {
                    html += `<div class="message-content">${this.formatContent(message)}</div>`;
                }
                
                messageDiv.innerHTML = html;
                chatWindow.appendChild(messageDiv);
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        });
    }

    /**
     * Get icon for model
     */
    getModelIcon(modelId) {
        const logoMap = {
            // GPT Models (ChatGPT logo)
            'gpt-4o': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-4o-mini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-4-nano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-4.1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-4.1-mini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-4.1-nano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-4.5-preview': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-5-mini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-5-nano': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'gpt-5-chat-latest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            
            // O Models (ChatGPT logo)
            'o1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'o1-mini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'o1-pro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'o3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'o3-mini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            'o4-mini': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png',
            
            // Claude Models
            'claude': 'http://res.cloudinary.com/dokduyqpk/image/upload/v1747139256/peueeehosysccnmwsszx.png',
            'claude-3-5-sonnet': 'http://res.cloudinary.com/dokduyqpk/image/upload/v1747139256/peueeehosysccnmwsszx.png',
            'claude-3-7-sonnet': 'http://res.cloudinary.com/dokduyqpk/image/upload/v1747139256/peueeehosysccnmwsszx.png',
            'claude-sonnet-4': 'http://res.cloudinary.com/dokduyqpk/image/upload/v1747139256/peueeehosysccnmwsszx.png',
            'claude-opus-4': 'http://res.cloudinary.com/dokduyqpk/image/upload/v1747139256/peueeehosysccnmwsszx.png',
            
            // Gemini Models
            'gemini-2.0-flash': 'https://external-preview.redd.it/google-gemini-app-released-on-play-store-v0-PaHuHdLaLzlIhGZix5lxb_si2F66Ln2KIdgYdyK_aBc.jpg?auto=webp&s=4e6eaebbfaf875e1920d792b4a6cd596b85b3db9',
            'gemini-1.5-flash': 'https://external-preview.redd.it/google-gemini-app-released-on-play-store-v0-PaHuHdLaLzlIhGZix5lxb_si2F66Ln2KIdgYdyK_aBc.jpg?auto=webp&s=4e6eaebbfaf875e1920d792b4a6cd596b85b3db9',
            
            // DeepSeek Models
            'deepseek-chat': 'https://deepseek-espanol.chat/wp-content/uploads/2025/05/eepseek-espanol-logo.webp',
            'deepseek-reasoner': 'https://deepseek-espanol.chat/wp-content/uploads/2025/05/eepseek-espanol-logo.webp',
            
            // Llama Models
            'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo': 'https://cdn.prod.website-files.com/63071746623d65622587f8b8/63071746623d65893787f9c1_new%20logo%20footer.svg',
            'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo': 'https://cdn.prod.website-files.com/63071746623d65622587f8b8/63071746623d65893787f9c1_new%20logo%20footer.svg',
            'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': 'https://cdn.prod.website-files.com/63071746623d65622587f8b8/63071746623d65893787f9c1_new%20logo%20footer.svg',
            
            // Mistral Models
            'mistral-large-latest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mistral_AI_logo_%282025%E2%80%93%29.svg/1200px-Mistral_AI_logo_%282025%E2%80%93%29.svg.png',
            'pixtral-large-latest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mistral_AI_logo_%282025%E2%80%93%29.svg/1200px-Mistral_AI_logo_%282025%E2%80%93%29.svg.png',
            'codestral-latest': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Mistral_AI_logo_%282025%E2%80%93%29.svg/1200px-Mistral_AI_logo_%282025%E2%80%93%29.svg.png',
            
            // Other Models
            'grok-beta': 'https://www.nan.xyz/wp-content/uploads/grok-seeklogo-.svg',
            'google/gemma-2-27b-it': 'https://custom.typingmind.com/assets/models/gemma.jpg',
            'dall-e-3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/250px-ChatGPT-Logo.svg.png'
        };
        
        const logoUrl = logoMap[modelId];
        if (logoUrl) {
            return `<img src="${logoUrl}" alt="${modelId}" class="model-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span class="fallback-icon" style="display:none;">🤖</span>`;
        }
        return '🤖';
    }

    /**
     * Display assistant message in specific chat window
     */
    displayAssistantMessage(modelId, content) {
        const chatWindow = this.chatWindows.get(modelId);
        if (chatWindow) {
            // Remove placeholder text
            const placeholder = chatWindow.querySelector('.placeholder-text');
            if (placeholder) {
                placeholder.remove();
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message assistant';
            messageDiv.innerHTML = `<div class="message-content">${this.formatContent(content)}</div>`;
            chatWindow.appendChild(messageDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;
            return messageDiv;
        }
        return null;
    }

    /**
     * Show typing indicator in specific chat window
     */
    showTypingIndicator(modelId) {
        const chatWindow = this.chatWindows.get(modelId);
        if (chatWindow) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.innerHTML = `
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            chatWindow.appendChild(typingDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;
            return typingDiv;
        }
        return null;
    }

    /**
     * Remove typing indicator from specific chat window
     */
    removeTypingIndicator(modelId) {
        const chatWindow = this.chatWindows.get(modelId);
        if (chatWindow) {
            const typingIndicator = chatWindow.querySelector('.typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
    }

    /**
     * Show all chat windows in scrollable grid
     */
    showAllChatWindows() {
        const chatGrid = document.querySelector('.chat-grid');
        const chatGridContainer = document.querySelector('.chat-grid-container');
        
        if (chatGrid && chatGridContainer) {
            // Calculate grid layout for 35 models - use 3 columns for optimal display
            const modelCount = document.querySelectorAll('.chat-window').length;
            const cols = 3; // Fixed layout for 35 models
            
            // Apply the calculated grid layout with important to override CSS
            chatGrid.style.setProperty('grid-template-columns', `repeat(${cols}, 1fr)`, 'important');
            chatGrid.style.setProperty('grid-template-rows', 'auto', 'important');
            
            // Show all chat windows and reset their heights
            document.querySelectorAll('.chat-window').forEach(window => {
                window.style.display = 'flex';
                window.style.height = '400px';
                window.style.maxHeight = '400px';
            });
            
            // Enable scrolling
            chatGridContainer.style.overflowY = 'auto';
        }
    }

    /**
     * Show single chat window
     */
    showSingleChatWindow(modelId) {
        const chatGrid = document.querySelector('.chat-grid');
        const chatGridContainer = document.querySelector('.chat-grid-container');
        
        if (chatGrid && chatGridContainer) {
            chatGrid.style.setProperty('grid-template-columns', '1fr', 'important');
            chatGrid.style.setProperty('grid-template-rows', 'auto', 'important');
            
            // Hide all windows first
            document.querySelectorAll('.chat-window').forEach(window => {
                window.style.display = 'none';
            });
            
            // Show only the selected window
            const targetWindow = document.querySelector(`[data-model="${modelId}"]`);
            if (targetWindow) {
                targetWindow.style.display = 'flex';
                targetWindow.style.height = 'calc(100vh - 200px)'; // Make single window taller
                targetWindow.style.maxHeight = 'calc(100vh - 200px)';
            }
            
            // Disable scrolling for single window view
            chatGridContainer.style.overflowY = 'hidden';
        }
    }

    /**
     * Update UI state
     */
    updateUI() {
        // Update send button state
        this.updateSendButtonState();
    }

    /**
     * Get current model parameters from UI
     */
    getCurrentModelParameters() {
        return {
            max_tokens: this.elements.maxTokensInput ? parseInt(this.elements.maxTokensInput.value, 10) : 1000,
            temperature: this.elements.temperatureInput ? parseFloat(this.elements.temperatureInput.value) : 0.7
        };
    }

    /**
     * Auto-resize textarea
     */
    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }

    /**
     * Update send button state
     */
    updateSendButtonState() {
        if (!this.elements.sendButton) return;
        
        const hasText = this.elements.messageInput && this.elements.messageInput.value.trim().length > 0;
        const hasImages = this.uploadedImages.length > 0;
        const canSend = (hasText || hasImages) && !this.isProcessing;
        
        this.elements.sendButton.disabled = !canSend;
        this.elements.sendButton.style.opacity = canSend ? '1' : '0.6';
    }

    /**
     * Format message content
     */
    formatContent(content) {
        if (!content) return '';
        
        // Escape HTML
        content = content.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
        
        // Convert line breaks
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }

    /**
     * Set send button loading state
     */
    setSendButtonLoading(loading) {
        if (!this.elements.sendButton) return;
        
        if (loading) {
            this.elements.sendButton.textContent = 'Sending...';
            this.elements.sendButton.disabled = true;
        } else {
            this.elements.sendButton.textContent = 'Send';
            this.updateSendButtonState();
        }
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        console.log('🎉 Welcome to Puter AI Chatbot!');
    }

    // =============================================
    // MOBILE AND RESPONSIVE FUNCTIONALITY
    // =============================================

    /**
     * Bind mobile-specific event listeners
     */
    bindMobileEvents() {
        // Mobile menu toggle button - works same as sidebar toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            });
        }
        
        // Close sidebar when clicking on model items only on very small screens
        this.elements.modelItems.forEach(item => {
            item.addEventListener('click', () => {
                // Only auto-collapse on mobile when sidebar is expanded
                if (window.innerWidth <= 575 && !sidebar?.classList.contains('collapsed')) {
                    setTimeout(() => this.collapseSidebar(), 200);
                }
            });
        });
    }

    /**
     * Initialize responsive grid handling
     */
    initResponsiveGrid() {
        this.updateGridLayout();
    }

    /**
     * Setup responsive window resize handlers
     */
    setupResponsiveHandlers() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        });
        
        // Initial check
        this.handleResize();
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        const wasInMobileView = this.isMobileView;
        this.isMobileView = window.innerWidth <= this.mobileBreakpoint;
        
        // Update grid layout
        this.updateGridLayout();
        
        console.log(`📱 Viewport: ${window.innerWidth}px, Mobile: ${this.isMobileView}`);
    }

    /**
     * Update grid layout based on screen size
     */
    updateGridLayout() {
        const chatGrid = document.querySelector('.chat-grid');
        if (!chatGrid) return;
        
        const width = window.innerWidth;
        let columns;
        
        // Determine columns based on breakpoints
        if (width >= 1600) {
            columns = 8; // Ultra-wide
        } else if (width >= 1400) {
            columns = 7; // Large desktop
        } else if (width >= 1200) {
            columns = 6; // Desktop
        } else if (width >= 1024) {
            columns = 4; // Medium desktop
        } else if (width >= 768) {
            columns = 3; // Tablet landscape
        } else if (width >= 576) {
            columns = 2; // Tablet portrait
        } else {
            columns = 1; // Mobile
        }
        
        // Apply the grid layout
        chatGrid.style.setProperty('--grid-columns', columns.toString());
        
        console.log(`🔧 Grid updated: ${columns} columns for ${width}px`);
    }

    /**
     * Toggle sidebar (works for all screen sizes)
     */
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    /**
     * Collapse sidebar
     */
    collapseSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.add('collapsed');
        }
    }

    /**
     * Expand sidebar
     */
    expandSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('collapsed');
        }
    }

    /**
     * Check if currently in mobile view
     */
    isMobile() {
        return this.isMobileView;
    }

    /**
     * Get current grid column count
     */
    getCurrentGridColumns() {
        const chatGrid = document.querySelector('.chat-grid');
        if (chatGrid) {
            const columns = chatGrid.style.getPropertyValue('--grid-columns');
            return parseInt(columns) || 3;
        }
        return 3;
    }

    /**
     * Set send button loading state
     */
    setSendButtonLoading(loading) {
        if (this.elements.sendButton) {
            this.elements.sendButton.disabled = loading;
            this.elements.sendButton.textContent = loading ? 'Sending...' : 'Send';
            
            // Update button state appearance
            if (loading) {
                this.elements.sendButton.classList.add('loading');
            } else {
                this.elements.sendButton.classList.remove('loading');
                // Restore proper button state based on content
                this.updateSendButtonState();
            }
        }
    }



    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        
        // Add welcome messages to each chat window
        this.activeModels.forEach(modelId => {
            const chatWindow = this.chatWindows.get(modelId);
            if (chatWindow) {
                const placeholder = chatWindow.querySelector('.placeholder-text');
                if (placeholder) {
                    // Update placeholder text to be more welcoming
                    const modelName = this.getModelDisplayName(modelId);
                    placeholder.textContent = `Ready to chat with ${modelName}`;
                }
            }
        });
    }

    /**
     * Get display name for model
     */
    getModelDisplayName(modelId) {
        const modelMap = {
            'gpt-4o': 'GPT-4o',
            'claude-3-5-sonnet': 'Claude 3.5',
            'gemini-2.0-flash': 'Gemini 2.0',
            'gpt-4o-mini': 'GPT-4o Mini'
        };
        return modelMap[modelId] || modelId;
    }

    /**
     * Scroll to bottom of chat window
     */
    scrollToBottom(modelId = null) {
        if (modelId) {
            const chatWindow = this.chatWindows.get(modelId);
            if (chatWindow) {
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        } else {
            // Scroll all chat windows
            this.chatWindows.forEach(chatWindow => {
                chatWindow.scrollTop = chatWindow.scrollHeight;
            });
        }
    }

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }





    /**
     * Update streaming message content
     */
    updateStreamingMessage(messageDiv, content, modelId = null) {
        // If modelId is provided, route to specific model container
        if (modelId && this.modelContainers.has(modelId)) {
            return this.updateModelStreamingMessage(modelId, content);
        }

        // Default behavior - update in main messages container
        // Only update the message content, no typing indicator
        const contentDiv = messageDiv.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.formatContent(content);
        } else {
            // If not present, create it
            const newContentDiv = document.createElement('div');
            newContentDiv.className = 'message-content';
            newContentDiv.innerHTML = this.formatContent(content);
            messageDiv.appendChild(newContentDiv);
        }
        this.scrollToBottom();
    }

    /**
     * Complete streaming message
     */
    completeStreamingMessage(messageDiv, modelId = null) {
        // If modelId is provided, route to specific model container
        if (modelId && this.modelContainers.has(modelId)) {
            return this.completeModelStreamingMessage(modelId);
        }

        // Default behavior - no typing indicator to remove anymore
    }

    /**
     * Format message content
     */
    formatContent(content) {
        if (!content) return '';

        // If content is not a string, convert it to string first
        if (typeof content !== 'string') {

            // Try to extract meaningful content from objects
            if (typeof content === 'object' && content !== null) {
                // If it's an object, try to stringify it nicely
                try {
                    content = JSON.stringify(content, null, 2);
                } catch (e) {
                    content = String(content);
                }
            } else {
                content = String(content);
            }
        }

        // Replace newlines with <br>
        content = content.replace(/\n/g, '<br>');

        // Basic markdown-like formatting
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        content = content.replace(/`(.*?)`/g, '<code>$1</code>');

        return content;
    }

    /**
     * Set button states
     */
    setButtonsState(enabled) {
        this.elements.sendButton.disabled = !enabled;

        if (enabled) {
            this.elements.sendButton.textContent = 'Send';
        } else {
            this.elements.sendButton.textContent = 'Sending...';
        }
    }

    /**
     * Update send button state based on input content
     */
    updateSendButtonState() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        const hasImages = this.uploadedImages.length > 0;
        const hasContent = hasText || hasImages;
        
        // Only update button state if not currently processing
        if (!this.isProcessing && this.elements.sendButton) {
            this.elements.sendButton.disabled = !hasContent;
            
            // Update button appearance
            if (hasContent) {
                this.elements.sendButton.classList.add('has-content');
                this.elements.sendButton.style.opacity = '1';
            } else {
                this.elements.sendButton.classList.remove('has-content');
                this.elements.sendButton.style.opacity = '0.6';
            }
        }
    }

    /**
     * Auto-resize textarea based on content
     */
    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        if (!textarea) return;

        // Store the current scroll position
        const scrollTop = textarea.scrollTop;
        
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        
        // Set height based on scrollHeight, with min and max limits
        const minHeight = this.isMobile() ? 24 : 28;
        const maxHeight = this.isMobile() ? 120 : 150;
        const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
        
        textarea.style.height = newHeight + 'px';
        
        // If content exceeds max height, enable scrolling
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto';
            textarea.scrollTop = scrollTop;
        } else {
            textarea.style.overflowY = 'hidden';
        }
        
        // Update send button state based on content
        this.updateSendButtonState();
        
        // On mobile, ensure the input stays in view when resizing
        if (this.isMobile() && document.activeElement === textarea) {
            setTimeout(() => {
                textarea.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end',
                    inline: 'nearest'
                });
            }, 100);
        }
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        const messages = this.elements.messages;
        if (messages) {
            // Use smooth scrolling on mobile for better UX
            if (this.isMobile()) {
                messages.scrollTo({
                    top: messages.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                messages.scrollTop = messages.scrollHeight;
            }
        }
    }

    /**
     * Initialize model containers for multi-model display
     */
    initializeModelContainers() {
        this.elements.modelContainers = document.getElementById('modelContainers');
        this.elements.toggleModels = document.getElementById('toggleModels');

        if (this.elements.toggleModels) {
            this.elements.toggleModels.addEventListener('click', () => {
                this.toggleModelsPanel();
            });
        }

        // Create containers for available models
        this.createModelContainers();
    }

    /**
     * Create containers for each available model
     */
    createModelContainers() {
        if (!this.elements.modelContainers) return;

        // Clear existing containers
        this.elements.modelContainers.innerHTML = '';
        this.modelContainers.clear();

        // Get available models from the select element
        const modelSelect = this.elements.modelSelect;
        if (!modelSelect) return;

        const options = modelSelect.querySelectorAll('option');
        options.forEach(option => {
            // Exclude GPT-4 Vision (value 'gpt-4') and DALL-E 3 (value 'dall-e-3')
            if (option.value && option.value !== '' && option.value !== 'gpt-4' && option.value !== 'dall-e-3') {
                this.createModelContainer(option.value, option.textContent);
            }
        });
    }

    /**
     * Create a container for a specific model
     */
    createModelContainer(modelId, modelName) {
        const container = document.createElement('div');
        container.className = 'model-container';
        container.id = `model-${modelId}`;
        container.innerHTML = `
            <div class="model-header">
                <h4>${modelName}</h4>
                <div class="model-status">
                    <div class="model-dot" id="status-${modelId}"></div>
                </div>
            </div>
            <div class="model-messages" id="messages-${modelId}">
                <div class="model-welcome">
                    <small>Waiting for response...</small>
                </div>
            </div>
        `;

        this.elements.modelContainers.appendChild(container);
        this.modelContainers.set(modelId, {
            container: container,
            messages: container.querySelector('.model-messages'),
            status: container.querySelector('.model-dot')
        });
    }

    /**
     * Display message in specific model container
     */
    displayModelMessage(modelId, content, sender, images = []) {
        const modelContainer = this.modelContainers.get(modelId);
        if (!modelContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        let html = '';

        if (images && images.length > 0) {
            html += '<div class="message-images">';
            images.forEach(img => {
                html += `<img src="${img.url}" alt="${img.name}" class="message-image">`;
            });
            html += '</div>';
        }

        if (content) {
            html += `<div class="message-content">${this.formatContent(content)}</div>`;
        }

        messageDiv.innerHTML = html;
        modelContainer.messages.appendChild(messageDiv);

        // Clear welcome message if it exists
        const welcomeMsg = modelContainer.messages.querySelector('.model-welcome');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        // Scroll to bottom
        modelContainer.messages.scrollTop = modelContainer.messages.scrollHeight;

        // Update status
        this.updateModelStatus(modelId, sender === 'assistant' ? 'completed' : 'active');
    }

    /**
     * Update streaming message in model container
     */
    updateModelStreamingMessage(modelId, content) {
        const modelContainer = this.modelContainers.get(modelId);
        if (!modelContainer) return;

        let messageDiv = modelContainer.messages.querySelector('.message.assistant:last-child');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.className = 'message assistant';
            modelContainer.messages.appendChild(messageDiv);
        }

        const contentDiv = messageDiv.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.innerHTML = this.formatContent(content);
        } else {
            const newContentDiv = document.createElement('div');
            newContentDiv.className = 'message-content';
            newContentDiv.innerHTML = this.formatContent(content);
            messageDiv.appendChild(newContentDiv);
        }

        modelContainer.messages.scrollTop = modelContainer.messages.scrollHeight;
    }

    /**
     * Complete streaming message in model container
     */
    completeModelStreamingMessage(modelId) {
        const modelContainer = this.modelContainers.get(modelId);
        if (!modelContainer) return;

        // Update status to completed
        this.updateModelStatus(modelId, 'completed');
    }

    /**
     * Update model status indicator
     */
    updateModelStatus(modelId, status) {
        const modelContainer = this.modelContainers.get(modelId);
        if (!modelContainer) return;

        const statusDot = modelContainer.status;
        if (!statusDot) return;

        // Remove all status classes
        statusDot.className = 'model-dot';

        // Add appropriate status class
        switch (status) {
            case 'active':
                statusDot.classList.add('active');
                break;
            case 'completed':
                statusDot.classList.add('completed');
                break;
            case 'error':
                statusDot.classList.add('error');
                break;
            default:
                statusDot.classList.add('idle');
        }
    }

    /**
     * Toggle models panel visibility
     */
    toggleModelsPanel() {
        const modelsPanel = document.querySelector('.models-panel');
        if (!modelsPanel) return;

        this.modelsPanelCollapsed = !this.modelsPanelCollapsed;

        if (this.modelsPanelCollapsed) {
            modelsPanel.classList.add('collapsed');
            this.elements.toggleModels.innerHTML = `
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            `;
        } else {
            modelsPanel.classList.remove('collapsed');
            this.elements.toggleModels.innerHTML = `
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
            `;
        }
    }

    /**
     * Clear all model containers
     */
    clearModelContainers() {
        this.modelContainers.forEach(container => {
            const messages = container.messages;
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'model-welcome';
            welcomeDiv.innerHTML = '<small>Waiting for response...</small>';
            messages.innerHTML = '';
            messages.appendChild(welcomeDiv);
            this.updateModelStatus(container.container.id.replace('model-', ''), 'idle');
        });
    }

    /**
     * Clear all chat windows
     */
    clearAllChatWindows() {
        this.chatWindows.forEach((chatWindow, modelId) => {
            chatWindow.innerHTML = `<div class="placeholder-text">Ready to chat with ${this.getModelDisplayName(modelId)}</div>`;
        });
    }

    /**
     * Get model display name
     */
    getModelDisplayName(modelId) {
        const model = puterModelCapabilities.getModel(modelId);
        return model ? model.name : modelId;
    }

    /**
     * Check if the device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}

// Create global instance
window.puterUIManager = new PuterUIManager();
