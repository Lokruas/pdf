document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM vollständig geladen - Initialisierung startet");

    // Zustandsvariablen
    let chats = {};
    let currentChatId = null;
    let chatCounter = 0;
    let waitingForFirstMessage = false;

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
            avatar.textContent = "V"; // V für V.I.T.A.L

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
        jumpItem.dataset.messageIndex = messageIndex;

        const contentSpan = document.createElement("span");
        contentSpan.className = "jump-item-content";
        contentSpan.textContent = originalContent.substring(0, 50) + (originalContent.length > 50 ? "..." : "");

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "jump-item-actions";

        const editButton = document.createElement("button");
        editButton.innerHTML = "✏️";
        editButton.title = "Titel bearbeiten";
        editButton.addEventListener("click", (e) => {
            e.stopPropagation();
            showEditTitleDialog(chatId, messageIndex, contentSpan.textContent);
        });

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "🗑️";
        deleteButton.title = "Eintrag löschen";
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteJumpItem(chatId, messageIndex);
        });

        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        jumpItem.appendChild(contentSpan);
        jumpItem.appendChild(actionsDiv);

        jumpItem.addEventListener("click", () => {
            scrollToMessage(messageIndex);
        });

        elements.chatJumpsList.appendChild(jumpItem);
    }

    function deleteJumpItem(chatId, messageIndex) {
        if (!confirm("Möchten Sie diesen Eintrag wirklich aus der Sidebar löschen?")) return;
        
        // Nur aus der Sidebar entfernen (nicht aus dem Chat)
        const jumpItem = elements.chatJumpsList.querySelector(`li[data-message-index="${messageIndex}"]`);
        if (jumpItem) {
            jumpItem.remove();
        }
    }

    function scrollToMessage(messageIndex) {
        const messages = document.querySelectorAll("#chat-output > div");
        if (messages.length > messageIndex) {
            messages[messageIndex].scrollIntoView({ 
                behavior: "smooth", 
                block: "center" 
            });
        }
    }

    function updateChatName(chatId, newName) {
        if (!chats[chatId]) return;
        
        chats[chatId].name = newName;
        const chatElement = document.querySelector(`#chat-list li[data-id="${chatId}"]`);
        if (chatElement) {
            chatElement.textContent = newName;
        }
    }

    function showEditTitleDialog(chatId, messageIndex, currentTitle) {
        if (!elements.editTitleDialog || !elements.editTitleInput) return;
        
        elements.editTitleInput.value = currentTitle;
        elements.editTitleDialog.style.display = "block";
        
        // Temporäre Event-Listener für Speichern/Abbrechen
        const saveHandler = () => {
            const newTitle = elements.editTitleInput.value.trim();
            if (newTitle) {
                // Update im Chat-Storage
                chats[chatId].jumpTitles[messageIndex] = newTitle;
                
                // Update in der Sidebar
                const jumpItem = elements.chatJumpsList.querySelector(`li[data-message-index="${messageIndex}"]`);
                if (jumpItem) {
                    jumpItem.querySelector('.jump-item-content').textContent = newTitle;
                }
            }
            elements.editTitleDialog.style.display = "none";
            elements.saveTitleButton.removeEventListener("click", saveHandler);
            elements.cancelTitleButton.removeEventListener("click", cancelHandler);
        };
        
        const cancelHandler = () => {
            elements.editTitleDialog.style.display = "none";
            elements.saveTitleButton.removeEventListener("click", saveHandler);
            elements.cancelTitleButton.removeEventListener("click", cancelHandler);
        };
        
        elements.saveTitleButton.addEventListener("click", saveHandler);
        elements.cancelTitleButton.addEventListener("click", cancelHandler);
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
        // Hier würde die tatsächliche KI-Integration stattfinden
        return `Ich habe Ihre Nachricht erhalten: "${userMessage}". Wie kann ich Ihnen helfen?`;
    }

    function sendMessage() {
        if (!elements.userInput) return;
        
        const text = elements.userInput.value.trim();
        if (!text) return;

        addMessage("user", text);
        elements.userInput.value = "";
    }

    // ========== EXPORT-FUNKTIONEN ========== //
    function showExportOptions() {
        if (!elements.exportOptions) return;
        
        elements.exportOptions.style.display = 
            elements.exportOptions.style.display === "block" ? "none" : "block";
    }

    function exportChat(format) {
        if (!currentChatId || !chats[currentChatId]) return;
        
        let exportContent = "";
        const chat = chats[currentChatId];
        
        switch(format) {
            case "txt":
                chat.messages.forEach(msg => {
                    exportContent += `${msg.role}: ${msg.content}\n\n`;
                });
                downloadFile(`chat_${currentChatId}.txt`, exportContent);
                break;
            case "json":
                downloadFile(`chat_${currentChatId}.json`, JSON.stringify(chat, null, 2));
                break;
            case "csv":
                exportContent = "Rolle,Inhalt\n";
                chat.messages.forEach(msg => {
                    exportContent += `"${msg.role}","${msg.content.replace(/"/g, '""')}"\n`;
                });
                downloadFile(`chat_${currentChatId}.csv`, exportContent);
                break;
        }
        
        elements.exportOptions.style.display = "none";
    }

    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ========== DATENKAMMER ========== //
    function initializeDataChamber() {
        if (!elements.dataChamberBody) return;
        
        elements.dataChamberBody.innerHTML = '';
        
        // 5 Feldpaare als Standard
        for (let i = 0; i < 5; i++) {
            addDataPair();
        }
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

    if (elements.toggleJumpsSidebarButton && elements.chatJumpsSidebar) {
        elements.toggleJumpsSidebarButton.addEventListener("click", () => {
            elements.chatJumpsSidebar.classList.toggle("collapsed");
        });
    }

    if (elements.closeJumpsSidebarButton && elements.chatJumpsSidebar) {
        elements.closeJumpsSidebarButton.addEventListener("click", () => {
            elements.chatJumpsSidebar.classList.add("collapsed");
        });
    }

    if (elements.exportButton && elements.exportOptions) {
        elements.exportButton.addEventListener("click", showExportOptions);
        
        // Event-Listener für Export-Optionen
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', () => {
                exportChat(btn.dataset.format);
            });
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
