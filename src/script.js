document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM vollständig geladen - Initialisierung startet");

    // Zustandsvariablen
    let chats = {};
    let currentChatId = null;
    let chatCounter = 0;
    let waitingForFirstMessage = false;
    let jumpTitles = {};

    // DOM-Elemente mit Fehlerbehandlung
    function getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`FEHLER: Element mit ID '${id}' nicht gefunden!`);
            return null;
        }
        return element;
    }

    // Alle benötigten Elemente
    const elements = {
        chatOutput: getElement('chat-output'),
        userInput: getElement('user-input'),
        sendButton: getElement('send-button'),
        exportButton: getElement('export-button'),
        exportOptions: getElement('export-options'),
        chatList: getElement('chat-list'),
        newChatButton: getElement('new-chat-button'),
        toggleSidebarButton: getElement('toggle-sidebar'),
        toggleJumpsSidebarButton: getElement('toggle-jumps-sidebar'),
        closeJumpsSidebarButton: getElement('close-jumps-sidebar'),
        sidebar: getElement('sidebar'),
        chatJumpsSidebar: getElement('chat-jumps-sidebar'),
        chatJumpsList: getElement('chat-jumps-list'),
        editTitleDialog: getElement('edit-jump-title-dialog'),
        editTitleInput: getElement('edit-jump-title-input'),
        saveTitleButton: getElement('save-jump-title'),
        cancelTitleButton: getElement('cancel-jump-title'),
        dataChamberButton: getElement('data-chamber-button'),
        dataChamber: getElement('data-chamber'),
        dataChamberClose: getElement('data-chamber-close'),
        dataChamberInfoButton: getElement('data-chamber-info-button'),
        dataChamberInfo: getElement('data-chamber-info'),
        dataChamberBody: getElement('data-chamber-body'),
        dataChamberSave: getElement('data-chamber-save'),
        dataChamberCancel: getElement('data-chamber-cancel')
    };

    // ========== CHAT-FUNKTIONEN ========== //
    function createChat(name = null) {
        const id = chatCounter++;
        chats[id] = { 
            name: name || `Chat ${id + 1}`, 
            messages: [],
            jumpTitles: {},
            dataPairs: [] // Für Datenkammer
        };
        currentChatId = id;
        waitingForFirstMessage = !name;

        const li = document.createElement("li");
        li.textContent = chats[id].name;
        li.dataset.id = id;
        li.addEventListener("click", () => {
            currentChatId = parseInt(li.dataset.id);
            waitingForFirstMessage = false;
            updateChatDisplay(currentChatId);
        });
        
        if (elements.chatList) {
            elements.chatList.appendChild(li);
        }
        
        updateChatDisplay(currentChatId);
    }

    function updateChatDisplay(chatId) {
        if (!elements.chatOutput || !elements.chatJumpsList) return;
        
        elements.chatOutput.innerHTML = "";
        elements.chatJumpsList.innerHTML = "";

        if (!chats[chatId]) return;

        chats[chatId].messages.forEach((msg, index) => {
            addMessageToOutput(msg.role, msg.content, index);
            if (msg.role === "user") {
                addJumpItem(chatId, index, msg.content);
            }
        });

        elements.chatOutput.scrollTop = elements.chatOutput.scrollHeight;
    }

    function addMessageToOutput(role, content, index) {
        if (!elements.chatOutput) return;

        if (role === "user") {
            const div = document.createElement("div");
            div.className = "message-user";
            div.textContent = content;
            div.dataset.messageIndex = index;
            elements.chatOutput.appendChild(div);
        } else {
            const botMessage = document.createElement("div");
            botMessage.className = "message-bot";

            const avatar = document.createElement("div");
            avatar.className = "bot-avatar";

            const messageContent = document.createElement("div");
            messageContent.className = "bot-message-content";
            messageContent.textContent = content;

            botMessage.appendChild(avatar);
            botMessage.appendChild(messageContent);
            botMessage.dataset.messageIndex = index;

            elements.chatOutput.appendChild(botMessage);
        }
    }

    function addJumpItem(chatId, messageIndex, originalContent) {
        if (!elements.chatJumpsList) return;

        const jumpItem = document.createElement("li");
        jumpItem.className = "jump-item";

        const contentSpan = document.createElement("span");
        contentSpan.className = "jump-item-content";
        contentSpan.textContent = originalContent.substring(0, 50) + (originalContent.length > 50 ? "..." : "");

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "jump-item-actions";

        const editButton = document.createElement("button");
        editButton.innerHTML = "✏️";
        editButton.addEventListener("click", (e) => {
            e.stopPropagation();
            showEditTitleDialog(chatId, messageIndex, contentSpan.textContent);
        });

        actionsDiv.appendChild(editButton);
        jumpItem.appendChild(contentSpan);
        jumpItem.appendChild(actionsDiv);

        jumpItem.addEventListener("click", () => {
            scrollToMessage(messageIndex);
        });

        elements.chatJumpsList.appendChild(jumpItem);
    }

    function scrollToMessage(messageIndex) {
        const messages = document.querySelectorAll("#chat-output > div");
        if (messages.length > messageIndex) {
            messages[messageIndex].scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    // ========== NACHRICHTENFUNKTIONEN ========== //
    function addMessage(role, content) {
        if (currentChatId === null) {
            createChat(content.substring(0, 20));
        } else if (waitingForFirstMessage && role === "user") {
            updateChatName(currentChatId, content.substring(0, 20));
            waitingForFirstMessage = false;
        }

        const messageIndex = chats[currentChatId].messages.length;
        chats[currentChatId].messages.push({ role, content });

        addMessageToOutput(role, content, messageIndex);

        if (role === "user") {
            addJumpItem(currentChatId, messageIndex, content);
            setTimeout(() => {
                const botResponse = generateBotResponse(content);
                addMessage("bot", botResponse);
            }, 400);
        }
    }

    function generateBotResponse(userMessage) {
        return `Ich habe Ihre Nachricht erhalten: "${userMessage}". Wie kann ich Ihnen helfen?`;
    }

    function sendMessage() {
        if (!elements.userInput) return;
        
        const text = elements.userInput.value.trim();
        if (!text) return;

        addMessage("user", text);
        elements.userInput.value = "";
    }

    // ========== DATENKAMMER ========== //
    function initializeDataChamber() {
        if (!elements.dataChamberBody) return;
        
        elements.dataChamberBody.innerHTML = '';
        
        // Lückenbüßer: 3 Test-Datenpaare
        const testData = [
            { key: "name", value: "Max Mustermann" },
            { key: "email", value: "max@example.com" },
            { key: "interesse", value: "Produkt X" }
        ];
        
        testData.forEach(pair => {
            addDataPair(pair.key, pair.value);
        });
    }

    function addDataPair(key = "", value = "") {
        if (!elements.dataChamberBody) return;
        
        const pairContainer = document.createElement("div");
        pairContainer.className = "data-pair-container";
        
        const keyInput = document.createElement("input");
        keyInput.type = "text";
        keyInput.className = "data-key-input";
        keyInput.value = key;
        keyInput.placeholder = "Feldname";
        
        const valueInput = document.createElement("input");
        valueInput.type = "text";
        valueInput.className = "data-value-input";
        valueInput.value = value;
        valueInput.placeholder = "Wert";
        
        pairContainer.appendChild(keyInput);
        pairContainer.appendChild(valueInput);
        elements.dataChamberBody.appendChild(pairContainer);
    }

    function saveDataChamber() {
        if (!currentChatId || !chats[currentChatId]) return;
        
        const pairs = [];
        const inputs = elements.dataChamberBody.querySelectorAll(".data-pair-container");
        
        inputs.forEach(container => {
            const key = container.querySelector(".data-key-input").value.trim();
            const value = container.querySelector(".data-value-input").value.trim();
            if (key) pairs.push({ key, value });
        });
        
        chats[currentChatId].dataPairs = pairs;
        if (elements.dataChamber) {
            elements.dataChamber.style.display = "none";
        }
        
        alert("Daten wurden gespeichert!");
    }

    // ========== EVENT-LISTENER ========== //
    if (elements.sendButton && elements.userInput) {
        elements.sendButton.addEventListener("click", sendMessage);
        elements.userInput.addEventListener("keydown", e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (elements.newChatButton) {
        elements.newChatButton.addEventListener("click", () => createChat());
    }

    if (elements.toggleSidebarButton && elements.sidebar) {
        elements.toggleSidebarButton.addEventListener("click", () => {
            elements.sidebar.classList.toggle("collapsed");
        });
    }

    if (elements.dataChamberButton && elements.dataChamber) {
        elements.dataChamberButton.addEventListener("click", () => {
            elements.dataChamber.style.display = "flex";
            initializeDataChamber();
        });
    }

    if (elements.dataChamberClose) {
        elements.dataChamberClose.addEventListener("click", () => {
            if (elements.dataChamber) {
                elements.dataChamber.style.display = "none";
            }
        });
    }

    if (elements.dataChamberSave) {
        elements.dataChamberSave.addEventListener("click", saveDataChamber);
    }

    if (elements.dataChamberCancel) {
        elements.dataChamberCancel.addEventListener("click", () => {
            if (elements.dataChamber) {
                elements.dataChamber.style.display = "none";
            }
        });
    }

    if (elements.dataChamberInfoButton && elements.dataChamberInfo) {
        elements.dataChamberInfoButton.addEventListener("click", () => {
            elements.dataChamberInfo.style.display = 
                elements.dataChamberInfo.style.display === "none" ? "block" : "none";
        });
    }

    // Initialisierung
    createChat("Hauptchat");
    console.log("Anwendung erfolgreich initialisiert");
});
