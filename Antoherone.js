document.addEventListener('DOMContentLoaded', function() {
    // DOM-Elemente
    const sidebar = document.getElementById('sidebar');
    const chatJumpsSidebar = document.getElementById('chat-jumps-sidebar');
    const questionnaireSidebar = document.getElementById('questionnaire-sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const toggleJumpsSidebarBtn = document.getElementById('toggle-jumps-sidebar');
    const toggleQuestionnaireBtn = document.getElementById('toggle-questionnaire-sidebar');
    const closeSidebarBtns = document.querySelectorAll('.close-sidebar');
    const newChatBtn = document.getElementById('new-chat-button');
    const chatList = document.getElementById('chat-list');
    const chatOutput = document.getElementById('chat-output');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-button');
    const exportBtn = document.getElementById('export-button');
    const exportOptions = document.getElementById('export-options');
    const editDialog = document.getElementById('edit-dialog');
    const editTitleInput = document.getElementById('edit-jump-title-input');
    const editSaveBtn = document.getElementById('edit-save-button');
    const editCancelBtn = document.getElementById('edit-cancel-button');
    const feedbackInput = document.querySelector('.feedback-input');

    // Zustandsvariablen
    let currentChatId = null;
    let chats = [];
    let currentEditItem = null;

    // Sidebar-Logik
    function toggleSidebar(sidebarElement) {
        // Schließt alle anderen Sidebars
        if (sidebarElement !== sidebar) sidebar.classList.add('collapsed');
        if (sidebarElement !== chatJumpsSidebar) chatJumpsSidebar.classList.add('collapsed');
        if (sidebarElement !== questionnaireSidebar) questionnaireSidebar.classList.add('collapsed');
        
        // Toggle die angeklickte Sidebar
        sidebarElement.classList.toggle('collapsed');
    }

    // Event Listener für Sidebar-Buttons
    toggleSidebarBtn.addEventListener('click', () => toggleSidebar(sidebar));
    toggleJumpsSidebarBtn.addEventListener('click', () => toggleSidebar(chatJumpsSidebar));
    toggleQuestionnaireBtn.addEventListener('click', () => toggleSidebar(questionnaireSidebar));

    closeSidebarBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parentSidebar = this.closest('[id$="-sidebar"]');
            parentSidebar.classList.add('collapsed');
        });
    });

    // Chat-Logik
    function createNewChat() {
        const chatId = 'chat-' + Date.now();
        const newChat = {
            id: chatId,
            title: 'Neuer Chat ' + (chats.length + 1),
            messages: []
        };
        chats.push(newChat);
        renderChatList();
        switchChat(chatId);
    }

    function renderChatList() {
        chatList.innerHTML = '';
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = chat.title;
            li.addEventListener('click', () => switchChat(chat.id));
            chatList.appendChild(li);
        });
    }

    function switchChat(chatId) {
        currentChatId = chatId;
        const chat = chats.find(c => c.id === chatId);
        renderChatMessages(chat.messages);
        updateActiveChatInList();
    }

    function updateActiveChatInList() {
        document.querySelectorAll('#chat-list li').forEach(li => {
            li.classList.remove('active');
        });
        const activeLi = Array.from(document.querySelectorAll('#chat-list li'))
            .find(li => li.textContent === chats.find(c => c.id === currentChatId).title);
        if (activeLi) activeLi.classList.add('active');
    }

    function renderChatMessages(messages) {
        chatOutput.innerHTML = '';
        messages.forEach(msg => {
            addMessageToChat(msg.role, msg.content);
        });
    }

    function addMessageToChat(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-${role}`;
        
        if (role === 'user') {
            messageDiv.textContent = content;
        } else {
            messageDiv.innerHTML = `
                <div class="bot-avatar">B</div>
                <div class="bot-message-content">${content}</div>
            `;
        }
        
        chatOutput.appendChild(messageDiv);
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }

    // Nachrichten senden
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        const chat = chats.find(c => c.id === currentChatId);
        if (!chat) return;

        // Nutzernachricht hinzufügen
        chat.messages.push({
            role: 'user',
            content: message
        });
        addMessageToChat('user', message);
        userInput.value = '';

        // Bot-Antwort simulieren
        setTimeout(() => {
            const botResponse = "Das ist eine simulierte Antwort. In einer echten Anwendung würde hier die KI antworten.";
            chat.messages.push({
                role: 'bot',
                content: botResponse
            });
            addMessageToChat('bot', botResponse);
        }, 1000);
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Chatverlauf (Jumps) Logik
    function renderChatJumps() {
        const chatJumpsList = document.getElementById('chat-jumps-list');
        chatJumpsList.innerHTML = '';
        
        if (!currentChatId) return;
        
        const chat = chats.find(c => c.id === currentChatId);
        if (!chat || !chat.messages) return;
        
        chat.messages.forEach((msg, index) => {
            if (msg.role === 'user') {
                const jumpItem = document.createElement('li');
                jumpItem.className = 'jump-item';
                jumpItem.innerHTML = `
                    <span class="jump-item-title">${msg.content.substring(0, 30)}${msg.content.length > 30 ? '...' : ''}</span>
                    <div class="jump-item-actions">
                        <button class="edit-jump" data-index="${index}">✏️</button>
                        <button class="delete-jump" data-index="${index}">🗑️</button>
                    </div>
                `;
                chatJumpsList.appendChild(jumpItem);
            }
        });

        // Event Listener für die Buttons hinzufügen
        document.querySelectorAll('.edit-jump').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                editJump(index);
            });
        });

        document.querySelectorAll('.delete-jump').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                deleteJump(index);
            });
        });
    }

    function editJump(index) {
        const chat = chats.find(c => c.id === currentChatId);
        if (!chat || !chat.messages[index]) return;
        
        currentEditItem = index;
        editTitleInput.value = chat.messages[index].content;
        editDialog.style.display = 'block';
    }

    function saveJumpEdit() {
        if (currentEditItem === null) return;
        
        const chat = chats.find(c => c.id === currentChatId);
        if (!chat || !chat.messages[currentEditItem]) return;
        
        chat.messages[currentEditItem].content = editTitleInput.value;
        renderChatMessages(chat.messages);
        renderChatJumps();
        closeEditDialog();
    }

    function deleteJump(index) {
        const chat = chats.find(c => c.id === currentChatId);
        if (!chat || !chat.messages[index]) return;
        
        chat.messages.splice(index, 1);
        renderChatMessages(chat.messages);
        renderChatJumps();
    }

    function closeEditDialog() {
        editDialog.style.display = 'none';
        currentEditItem = null;
        editTitleInput.value = '';
    }

    editSaveBtn.addEventListener('click', saveJumpEdit);
    editCancelBtn.addEventListener('click', closeEditDialog);

    // Export-Logik
    exportBtn.addEventListener('click', function() {
        exportOptions.style.display = exportOptions.style.display === 'flex' ? 'none' : 'flex';
    });

    document.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', function() {
            alert(`Chat würde als ${this.textContent} exportiert werden`);
            exportOptions.style.display = 'none';
        });
    });

    // Fragebogen-Logik
    function saveQuestionnaire() {
        const keyInputs = document.querySelectorAll('.data-key-input');
        const valueInputs = document.querySelectorAll('.data-value-input');
        const feedback = feedbackInput.value;
        
        const data = {
            entries: Array.from(keyInputs).map((input, index) => ({
                key: input.value,
                value: valueInputs[index].value
            })),
            feedback: feedback
        };
        
        console.log('Gespeicherte Fragebogendaten:', data);
        alert('Fragebogen wurde gespeichert!');
        questionnaireSidebar.classList.add('collapsed');
    }

    function addQuestionnaireEntry() {
        const container = document.querySelector('.sidebar-content');
        const newEntry = document.createElement('div');
        newEntry.className = 'data-pair-container';
        newEntry.innerHTML = `
            <input type="text" class="data-key-input" placeholder="Schlüssel">
            <input type="text" class="data-value-input" placeholder="Wert">
        `;
        container.insertBefore(newEntry, document.querySelector('.feedback-container'));
    }

    // Initialisierung
    function init() {
        // Beispiel-Chats erstellen
        chats = [
            {
                id: 'chat-1',
                title: 'Erster Chat',
                messages: [
                    { role: 'user', content: 'Hallo, wie geht es dir?' },
                    { role: 'bot', content: 'Hallo! Mir geht es gut, danke der Nachfrage.' }
                ]
            },
            {
                id: 'chat-2',
                title: 'Zweiter Chat',
                messages: [
                    { role: 'user', content: 'Was ist die Hauptstadt von Frankreich?' },
                    { role: 'bot', content: 'Die Hauptstadt von Frankreich ist Paris.' }
                ]
            }
        ];

        renderChatList();
        if (chats.length > 0) {
            switchChat(chats[0].id);
        }
    }

    init();
});
