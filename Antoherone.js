document.addEventListener('DOMContentLoaded', function() {
    console.log("V.I.T.A.L Chat-Anwendung wird initialisiert");

    // ========== ZUSTANDSVARIABLEN ========== //
    let chats = {};
    let currentChatId = null;
    let chatCounter = 0;
    let waitingForFirstMessage = false;
    let jumpTitles = {};
    let activeSidebar = null;
    const MAX_FEEDBACK_LENGTH = 2000;

    // ========== DOM-ELEMENTE ========== //
    const elements = {
        // Hauptbereich
        app: document.getElementById('app'),
        mainArea: document.getElementById('main-area'),
        chatContainer: document.getElementById('chat-container'),
        chatOutput: document.getElementById('chat-output'),
        userInput: document.getElementById('user-input'),
        sendButton: document.getElementById('send-button'),
        
        // Header & Navigation
        chatHeader: document.getElementById('chat-header'),
        exportButton: document.getElementById('export-button'),
        exportOptions: document.getElementById('export-options'),
        
        // Linke Sidebar (Chats + Verlauf)
        sidebar: document.getElementById('sidebar'),
        chatList: document.getElementById('chat-list'),
        newChatButton: document.getElementById('new-chat-button'),
        toggleSidebarButton: document.getElementById('toggle-sidebar'),
        chatHistoryContainer: document.getElementById('chat-history-container'),
        chatJumpsList: document.getElementById('chat-jumps-list'),
        
        // Rechte Sidebar (Fragebogen)
        questionnaireSidebar: document.getElementById('questionnaire-sidebar'),
        toggleQuestionnaireButton: document.getElementById('toggle-questionnaire-sidebar'),
        questionnaireContent: document.querySelector('.sidebar-content'),
        feedbackInput: document.querySelector('.feedback-input'),
        addFieldButton: document.getElementById('add-questionnaire-field'),
        questionnaireSave: document.getElementById('questionnaire-save'),
        questionnaireCancel: document.getElementById('questionnaire-cancel'),
        
        // Dialoge
        editTitleDialog: document.getElementById('edit-jump-title-dialog'),
        editTitleInput: document.getElementById('edit-jump-title-input'),
        saveTitleButton: document.getElementById('save-jump-title'),
        cancelTitleButton: document.getElementById('cancel-jump-title')
    };

    // ========== HELPER-FUNKTIONEN ========== //
    function validateElement(element, name) {
        if (!element) {
            console.error(`Kritisches Fehler: Element ${name} nicht gefunden!`);
            return false;
        }
        return true;
    }

    function initializeElements() {
        for (const [key, element] of Object.entries(elements)) {
            validateElement(element, key);
        }
    }

    // ========== SIDEBAR-STEUERUNG ========== //
    function toggleSidebar(sidebarType) {
        // Schließe die aktuell geöffnete Sidebar
        if (activeSidebar && activeSidebar !== sidebarType) {
            if (activeSidebar === 'main') {
                elements.sidebar.classList.add('collapsed');
            } else if (activeSidebar === 'questionnaire') {
                elements.questionnaireSidebar.classList.add('collapsed');
            }
        }

        // Öffne/Schließe die gewünschte Sidebar
        if (sidebarType === 'main') {
            elements.sidebar.classList.toggle('collapsed');
            activeSidebar = elements.sidebar.classList.contains('collapsed') ? null : 'main';
        } 
        else if (sidebarType === 'questionnaire') {
            elements.questionnaireSidebar.classList.toggle('collapsed');
            activeSidebar = elements.questionnaireSidebar.classList.contains('collapsed') ? null : 'questionnaire';
            
            // Initialisiere den Fragebogen beim Öffnen
            if (activeSidebar === 'questionnaire') {
                initializeQuestionnaire();
            }
        }

        // Anpassung des Hauptbereichs bei geöffneter Sidebar
        adjustMainArea();
    }

    function adjustMainArea() {
        if (activeSidebar === 'main') {
            elements.mainArea.style.marginLeft = '250px';
        } else if (activeSidebar === 'questionnaire') {
            elements.mainArea.style.marginRight = '280px';
        } else {
            elements.mainArea.style.marginLeft = '0';
            elements.mainArea.style.marginRight = '0';
        }
    }

    // ========== CHAT-VERWALTUNG ========== //
    function createChat(name = null) {
        const id = `chat-${Date.now()}-${chatCounter++}`;
        const chatName = name || `Chat ${chatCounter}`;
        
        chats[id] = {
            id,
            name: chatName,
            created: new Date(),
            messages: [],
            jumpTitles: {},
            questionnaire: {
                fields: [
                    { key: 'Name', value: '' },
                    { key: 'Email', value: '' },
                    { key: 'Telefon', value: '' }
                ],
                feedback: ''
            }
        };

        currentChatId = id;
        waitingForFirstMessage = !name;

        // Chat zur Sidebar hinzufügen
        const chatElement = document.createElement('li');
        chatElement.className = 'chat-item';
        chatElement.dataset.chatId = id;
        chatElement.innerHTML = `
            <span class="chat-name">${chatName}</span>
            <span class="chat-date">${formatDate(new Date())}</span>
        `;
        
        chatElement.addEventListener('click', () => loadChat(id));
        elements.chatList.appendChild(chatElement);

        // Verlauf zurücksetzen
        elements.chatJumpsList.innerHTML = '';

        // Chat anzeigen
        updateChatDisplay();
        
        return id;
    }

    function loadChat(chatId) {
        if (!chats[chatId]) return;
        
        currentChatId = chatId;
        waitingForFirstMessage = false;
        
        // Markiere aktiven Chat in der Liste
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.toggle('active', item.dataset.chatId === chatId);
        });
        
        updateChatDisplay();
    }

    function updateChatDisplay() {
        if (!currentChatId || !chats[currentChatId]) return;
        
        const chat = chats[currentChatId];
        
        // Nachrichten anzeigen
        elements.chatOutput.innerHTML = '';
        chat.messages.forEach((msg, index) => {
            addMessageToDisplay(msg.role, msg.content, index);
        });
        
        // Verlauf aktualisieren
        updateChatHistory();
        
        // Scrollen zur letzten Nachricht
        elements.chatOutput.scrollTop = elements.chatOutput.scrollHeight;
    }

    function updateChatHistory() {
        if (!currentChatId || !chats[currentChatId]) return;
        
        elements.chatJumpsList.innerHTML = '';
        const chat = chats[currentChatId];
        
        chat.messages.forEach((msg, index) => {
            if (msg.role === 'user') {
                addJumpItem(index, msg.content);
            }
        });
    }

    // ========== NACHRICHTEN-VERARBEITUNG ========== //
    function addMessage(role, content) {
        if (!currentChatId) {
            currentChatId = createChat(content.substring(0, 30));
        } else if (waitingForFirstMessage && role === 'user') {
            updateChatName(currentChatId, content.substring(0, 30));
            waitingForFirstMessage = false;
        }

        const message = {
            role,
            content,
            timestamp: new Date(),
            id: `msg-${Date.now()}`
        };

        chats[currentChatId].messages.push(message);
        addMessageToDisplay(role, content, chats[currentChatId].messages.length - 1);

        if (role === 'user') {
            addJumpItem(chats[currentChatId].messages.length - 1, content);
            
            // Simulierte Bot-Antwort
            setTimeout(() => {
                const botResponse = generateBotResponse(content);
                addMessage('bot', botResponse);
            }, 500);
        }

        elements.chatOutput.scrollTop = elements.chatOutput.scrollHeight;
    }

    function addMessageToDisplay(role, content, index) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.dataset.messageIndex = index;

        if (role === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">${content}</div>
                <div class="message-time">${formatTime(new Date())}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-header">
                    <div class="bot-avatar">V</div>
                    <div class="bot-name">V.I.T.A.L</div>
                </div>
                <div class="message-content">${content}</div>
                <div class="message-time">${formatTime(new Date())}</div>
            `;
        }

        elements.chatOutput.appendChild(messageDiv);
    }

    function generateBotResponse(userMessage) {
        // Hier würde normalerweise die KI-Antwort generiert werden
        const responses = [
            "Ich habe Ihre Frage erhalten: '" + userMessage + "'. Lassen Sie mich das für Sie recherchieren.",
            "Interessante Frage: '" + userMessage + "'. Hier ist was ich dazu weiß...",
            "Danke für Ihre Nachricht. Zu '" + userMessage + "' kann ich folgendes sagen...",
            "'" + userMessage + "' ist ein wichtiges Thema. Hier sind die relevanten Informationen..."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // ========== CHAT-VERLAUF (JUMPS) ========== //
    function addJumpItem(messageIndex, originalContent) {
        if (!currentChatId || !chats[currentChatId]) return;
        
        const chat = chats[currentChatId];
        const jumpTitle = chat.jumpTitles[messageIndex] || originalContent.substring(0, 50) + (originalContent.length > 50 ? '...' : '');
        
        const jumpItem = document.createElement('li');
        jumpItem.className = 'jump-item';
        jumpItem.dataset.messageIndex = messageIndex;
        jumpItem.innerHTML = `
            <span class="jump-content">${jumpTitle}</span>
            <div class="jump-actions">
                <button class="edit-jump" title="Titel bearbeiten">✏️</button>
                <button class="delete-jump" title="Aus Verlauf löschen">🗑️</button>
            </div>
        `;
        
        jumpItem.querySelector('.edit-jump').addEventListener('click', (e) => {
            e.stopPropagation();
            showEditTitleDialog(messageIndex, jumpTitle);
        });
        
        jumpItem.querySelector('.delete-jump').addEventListener('click', (e) => {
            e.stopPropagation();
            removeJumpItem(messageIndex);
        });
        
        jumpItem.addEventListener('click', () => {
            scrollToMessage(messageIndex);
        });
        
        elements.chatJumpsList.appendChild(jumpItem);
    }

    function showEditTitleDialog(messageIndex, currentTitle) {
        elements.editTitleInput.value = currentTitle;
        elements.editTitleDialog.style.display = 'block';
        
        const saveHandler = () => {
            const newTitle = elements.editTitleInput.value.trim();
            if (newTitle && currentChatId) {
                chats[currentChatId].jumpTitles[messageIndex] = newTitle;
                updateChatHistory();
            }
            closeEditDialog();
        };
        
        elements.saveTitleButton.onclick = saveHandler;
        elements.cancelTitleButton.onclick = closeEditDialog;
    }

    function closeEditDialog() {
        elements.editTitleDialog.style.display = 'none';
        elements.editTitleInput.value = '';
        elements.saveTitleButton.onclick = null;
        elements.cancelTitleButton.onclick = null;
    }

    function removeJumpItem(messageIndex) {
        if (!confirm('Diesen Eintrag wirklich aus dem Verlauf entfernen?')) return;
        
        if (currentChatId && chats[currentChatId]) {
            delete chats[currentChatId].jumpTitles[messageIndex];
            updateChatHistory();
        }
    }

    function scrollToMessage(messageIndex) {
        const messages = elements.chatOutput.querySelectorAll('.message');
        if (messages.length > messageIndex) {
            messages[messageIndex].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }

    // ========== FRAGEBOGEN-FUNKTIONALITÄT ========== //
    function initializeQuestionnaire() {
        if (!currentChatId || !chats[currentChatId]) return;
        
        const chat = chats[currentChatId];
        elements.questionnaireContent.innerHTML = '';
        
        // Felder hinzufügen
        chat.questionnaire.fields.forEach((field, index) => {
            addQuestionnaireField(field.key, field.value, index);
        });
        
        // Feedback-Bereich
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'feedback-container';
        feedbackContainer.innerHTML = `
            <label for="feedback-input">Ihr Feedback:</label>
            <textarea id="feedback-input" class="feedback-input" 
                      placeholder="Bitte teilen Sie uns Ihre Meinung mit (mindestens 5 Sätze)..."
                      maxlength="${MAX_FEEDBACK_LENGTH}">${chat.questionnaire.feedback}</textarea>
            <div class="feedback-counter">0/${MAX_FEEDBACK_LENGTH} Zeichen</div>
        `;
        elements.questionnaireContent.appendChild(feedbackContainer);
        
        // Zeichenzähler für Feedback
        const feedbackInput = feedbackContainer.querySelector('#feedback-input');
        const counter = feedbackContainer.querySelector('.feedback-counter');
        
        feedbackInput.addEventListener('input', () => {
            counter.textContent = `${feedbackInput.value.length}/${MAX_FEEDBACK_LENGTH}`;
        });
        
        // Steuerungs-Buttons
        const controls = document.createElement('div');
        controls.className = 'questionnaire-controls';
        controls.innerHTML = `
            <button id="add-questionnaire-field" class="secondary-button">
                + Weitere Frage hinzufügen
            </button>
            <div>
                <button id="questionnaire-cancel" class="secondary-button">Abbrechen</button>
                <button id="questionnaire-save" class="primary-button">Speichern</button>
            </div>
        `;
        elements.questionnaireContent.appendChild(controls);
        
        // Event-Listener für neue Buttons
        document.getElementById('add-questionnaire-field').addEventListener('click', addNewQuestionnaireField);
        document.getElementById('questionnaire-save').addEventListener('click', saveQuestionnaire);
        document.getElementById('questionnaire-cancel').addEventListener('click', () => toggleSidebar('questionnaire'));
    }

    function addQuestionnaireField(key = '', value = '', index = -1) {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'data-pair-container';
        fieldContainer.dataset.fieldIndex = index;
        fieldContainer.innerHTML = `
            <input type="text" class="data-key-input" value="${key}" placeholder="Feldname">
            <input type="text" class="data-value-input" value="${value}" placeholder="Wert">
            <button class="remove-field-button" title="Feld entfernen">×</button>
        `;
        
        fieldContainer.querySelector('.remove-field-button').addEventListener('click', () => {
            fieldContainer.remove();
        });
        
        elements.questionnaireContent.insertBefore(
            fieldContainer, 
            document.querySelector('.feedback-container')
        );
    }

    function addNewQuestionnaireField() {
        addQuestionnaireField('', '', -1);
    }

    function saveQuestionnaire() {
        if (!currentChatId || !chats[currentChatId]) return;
        
        const chat = chats[currentChatId];
        const fields = [];
        
        // Sammle alle Felder
        document.querySelectorAll('.data-pair-container').forEach(container => {
            const key = container.querySelector('.data-key-input').value.trim();
            const value = container.querySelector('.data-value-input').value.trim();
            if (key) {
                fields.push({ key, value });
            }
        });
        
        // Sammle Feedback
        const feedbackInput = document.getElementById('feedback-input');
        const feedback = feedbackInput ? feedbackInput.value.trim() : '';
        
        // Aktualisiere Chat-Daten
        chat.questionnaire = {
            fields,
            feedback
        };
        
        alert('Fragebogen wurde erfolgreich gespeichert!');
        toggleSidebar('questionnaire');
    }

    // ========== HILFSFUNKTIONEN ========== //
    function formatDate(date) {
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function formatTime(date) {
        return date.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function updateChatName(chatId, newName) {
        if (!chatId || !chats[chatId]) return;
        
        chats[chatId].name = newName;
        const chatElement = document.querySelector(`.chat-item[data-chat-id="${chatId}"] .chat-name`);
        if (chatElement) {
            chatElement.textContent = newName;
        }
    }

    // ========== EVENT-HANDLER ========== //
    function setupEventListeners() {
        // Nachricht senden
        elements.sendButton.addEventListener('click', sendMessage);
        elements.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Sidebar-Steuerung
        elements.toggleSidebarButton.addEventListener('click', () => toggleSidebar('main'));
        elements.toggleQuestionnaireButton.addEventListener('click', () => toggleSidebar('questionnaire'));
        
        // Chat-Verwaltung
        elements.newChatButton.addEventListener('click', () => createChat());
        
        // Export-Funktionen
        elements.exportButton.addEventListener('click', () => {
            elements.exportOptions.style.display = 
                elements.exportOptions.style.display === 'flex' ? 'none' : 'flex';
        });
        
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                exportChat(format);
                elements.exportOptions.style.display = 'none';
            });
        });
        
        // Klick außerhalb der Export-Optionen schließt das Menü
        document.addEventListener('click', (e) => {
            if (!elements.exportOptions.contains(e.target) && 
                e.target !== elements.exportButton) {
                elements.exportOptions.style.display = 'none';
            }
        });
    }

    function sendMessage() {
        const message = elements.userInput.value.trim();
        if (!message) return;
        
        addMessage('user', message);
        elements.userInput.value = '';
    }

    function exportChat(format) {
        if (!currentChatId || !chats[currentChatId]) return;
        
        const chat = chats[currentChatId];
        let content, mimeType, extension;
        
        switch(format) {
            case 'json':
                content = JSON.stringify({
                    name: chat.name,
                    created: chat.created,
                    messages: chat.messages,
                    questionnaire: chat.questionnaire
                }, null, 2);
                mimeType = 'application/json';
                extension = 'json';
                break;
                
            case 'txt':
                content = `Chat: ${chat.name}\nErstellt am: ${formatDate(chat.created)}\n\n`;
                content += chat.messages.map(msg => {
                    return `${msg.role === 'user' ? 'Sie' : 'V.I.T.A.L'}: ${msg.content}`;
                }).join('\n\n');
                mimeType = 'text/plain';
                extension = 'txt';
                break;
                
            case 'csv':
                content = 'Rolle,Datum,Uhrzeit,Nachricht\n';
                content += chat.messages.map(msg => {
                    const date = formatDate(msg.timestamp);
                    const time = formatTime(msg.timestamp);
                    return `"${msg.role}","${date}","${time}","${msg.content.replace(/"/g, '""')}"`;
                }).join('\n');
                mimeType = 'text/csv';
                extension = 'csv';
                break;
                
            default:
                return;
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VITAL-Chat-${chat.name}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ========== INITIALISIERUNG ========== //
    function initialize() {
        initializeElements();
        setupEventListeners();
        
        // Ersten Chat erstellen
        createChat('Mein erster Chat');
        
        // Beispiel-Nachricht hinzufügen
        setTimeout(() => {
            addMessage('bot', 'Hallo! Ich bin V.I.T.A.L, Ihr virtueller Assistent. Wie kann ich Ihnen helfen?');
        }, 500);
        
        console.log('V.I.T.A.L Chat-Anwendung erfolgreich gestartet');
    }

    initialize();
});
