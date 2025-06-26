// Zustandsvariablen
let chats = {};
let currentChatId = null;
let chatCounter = 0;
let waitingForFirstMessage = false;
let jumpTitles = {}; // Speichert angepasste Titel für Chatsprünge

// DOM-Elemente
const chatOutput = document.getElementById("chat-output");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const exportButton = document.getElementById("export-button");
const exportOptions = document.getElementById("export-options");
const chatList = document.getElementById("chat-list");
const newChatButton = document.getElementById("new-chat-button");
const toggleSidebarButton = document.getElementById("toggle-sidebar");
const toggleJumpsSidebarButton = document.getElementById("toggle-jumps-sidebar");
const closeJumpsSidebarButton = document.getElementById("close-jumps-sidebar");
const sidebar = document.getElementById("sidebar");
const chatJumpsSidebar = document.getElementById("chat-jumps-sidebar");
const chatJumpsList = document.getElementById("chat-jumps-list");
const editTitleDialog = document.getElementById("edit-jump-title-dialog");
const editTitleInput = document.getElementById("edit-jump-title-input");
const saveTitleButton = document.getElementById("save-jump-title");
const cancelTitleButton = document.getElementById("cancel-jump-title");

// Datenkammer Elemente
const dataChamberButton = document.getElementById("data-chamber-button");
const dataChamber = document.getElementById("data-chamber");
const dataChamberClose = document.getElementById("data-chamber-close");
const dataChamberBody = document.getElementById("data-chamber-body");
const dataChamberSave = document.getElementById("data-chamber-save");
const dataChamberCancel = document.getElementById("data-chamber-cancel");
const dataChamberInfo = document.getElementById("data-chamber-info");
const dataChamberInfoButton = document.getElementById("data-chamber-info-button");

// Event Listener für Sidebars
toggleSidebarButton.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

toggleJumpsSidebarButton.addEventListener("click", () => {
  chatJumpsSidebar.classList.toggle("collapsed");
});

closeJumpsSidebarButton.addEventListener("click", () => {
  chatJumpsSidebar.classList.add("collapsed");
});

// Datenkammer Event Listener
dataChamberButton.addEventListener("click", () => {
  dataChamber.classList.add("active");
  initializeDataChamber();
});

dataChamberClose.addEventListener("click", () => {
  dataChamber.classList.remove("active");
});

dataChamberCancel.addEventListener("click", () => {
  dataChamber.classList.remove("active");
});

dataChamberSave.addEventListener("click", saveDataChamber);

dataChamberInfoButton.addEventListener("click", () => {
  dataChamberInfo.style.display = dataChamberInfo.style.display === "none" ? "block" : "none";
});

// Chat-Funktionen
function createChat(name = null) {
  const id = chatCounter++;
  chats[id] = { 
    name: name || `Chat ${id + 1}`, 
    messages: [],
    jumpTitles: {}, // Speichert angepasste Titel für diesen Chat
    dataPairs: [] // Speichert Datenpaare für diesen Chat
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
  chatList.appendChild(li);
  
  chatJumpsList.innerHTML = "";
  updateChatDisplay(currentChatId);
}

function updateChatDisplay(chatId) {
  chatOutput.innerHTML = "";
  chatJumpsList.innerHTML = "";
  
  if (!chats[chatId]) return;
  
  chats[chatId].messages.forEach((msg, index) => {
    addMessageToOutput(msg.role, msg.content, index);
    
    // Nur Nutzernachrichten in die Sidebar aufnehmen
    if (msg.role === "user") {
      addJumpItem(chatId, index, msg.content);
    }
  });
  
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function updateChatName(chatId, newName) {
  if (!chats[chatId]) return;
  
  chats[chatId].name = newName;
  
  // Aktualisiere den Namen in der Sidebar
  const chatItem = document.querySelector(`#chat-list li[data-id="${chatId}"]`);
  if (chatItem) {
    chatItem.textContent = newName;
  }
}

function addMessageToOutput(role, content, index) {
  if (role === "user") {
    const div = document.createElement("div");
    div.className = "message-user";
    div.textContent = content;
    div.dataset.messageIndex = index;
    chatOutput.appendChild(div);
  } else {
    // Bot-Nachricht mit Avatar
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
    
    chatOutput.appendChild(botMessage);
  }
}

function addJumpItem(chatId, messageIndex, originalContent) {
  const jumpItem = document.createElement("li");
  jumpItem.className = "jump-item";
  
  const contentSpan = document.createElement("span");
  contentSpan.className = "jump-item-content";
  
  // Verwendet angepassten Titel falls vorhanden, sonst Original
  const displayText = chats[chatId].jumpTitles[messageIndex] || 
                     originalContent.substring(0, 50) + 
                     (originalContent.length > 50 ? "..." : "");
  contentSpan.textContent = displayText;
  
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "jump-item-actions";
  
  // Bearbeiten-Button
  const editButton = document.createElement("button");
  editButton.innerHTML = "✏️";
  editButton.title = "Titel bearbeiten";
  editButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showEditTitleDialog(chatId, messageIndex, displayText);
  });
  
  // Löschen-Button
  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "🗑️";
  deleteButton.title = "Aus Verlauf löschen";
  deleteButton.addEventListener("click", (e) => {
    e.stopPropagation();
    removeJumpItem(chatId, messageIndex);
  });
  
  actionsDiv.appendChild(editButton);
  actionsDiv.appendChild(deleteButton);
  
  jumpItem.appendChild(contentSpan);
  jumpItem.appendChild(actionsDiv);
  
  jumpItem.addEventListener("click", () => {
    scrollToMessage(messageIndex);
  });
  
  chatJumpsList.appendChild(jumpItem);
}

function showEditTitleDialog(chatId, messageIndex, currentTitle) {
  editTitleInput.value = currentTitle;
  editTitleDialog.style.display = "block";
  
  const saveHandler = () => {
    const newTitle = editTitleInput.value.trim();
    if (newTitle) {
      // Speichere angepassten Titel für diesen Chat und Nachricht
      chats[chatId].jumpTitles[messageIndex] = newTitle;
      
      // Aktualisiere die Anzeige in der Sidebar
      const jumpItems = document.querySelectorAll("#chat-jumps-list .jump-item");
      if (jumpItems.length > messageIndex) {
        jumpItems[messageIndex].querySelector(".jump-item-content").textContent = newTitle;
      }
    }
    editTitleDialog.style.display = "none";
    saveTitleButton.removeEventListener("click", saveHandler);
  };
  
  const cancelHandler = () => {
    editTitleDialog.style.display = "none";
    saveTitleButton.removeEventListener("click", saveHandler);
  };
  
  saveTitleButton.addEventListener("click", saveHandler);
  cancelTitleButton.addEventListener("click", cancelHandler);
}

function removeJumpItem(chatId, messageIndex) {
  if (confirm("Diesen Eintrag aus dem Verlauf entfernen? Die Nachricht bleibt im Chat erhalten.")) {
    // Lösche nur den angepassten Titel falls vorhanden
    if (chats[chatId].jumpTitles[messageIndex]) {
      delete chats[chatId].jumpTitles[messageIndex];
    }
    
    // Aktualisiere die Sidebar-Anzeige
    updateChatDisplay(chatId);
  }
}

function scrollToMessage(messageIndex) {
  const messages = document.querySelectorAll("#chat-output > div");
  if (messages.length > messageIndex) {
    messages[messageIndex].scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Nachrichtenfunktionen
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
    
    // Automatische Bot-Antwort
    setTimeout(() => {
      const botResponseIndex = chats[currentChatId].messages.length;
      const botResponse = generateBotResponse(content);
      chats[currentChatId].messages.push({ role: "bot", content: botResponse });
      addMessageToOutput("bot", botResponse, botResponseIndex);
    }, 400);
  }
  
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function generateBotResponse(userMessage) {
  // Hier würde normalerweise die API-Anfrage stehen
  // Für Demo-Zwecke eine einfache Antwort
  return `Ich habe Ihre Nachricht "${userMessage}" erhalten. Wie kann ich Ihnen weiterhelfen?`;
}

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  userInput.value = "";
}

// Datenkammer Funktionen
function initializeDataChamber() {
  dataChamberBody.innerHTML = '';
  
  if (!chats[currentChatId]) return;
  
  // Füge bestehende Datenpaare hinzu
  const pairs = chats[currentChatId].dataPairs;
  if (pairs && pairs.length > 0) {
    pairs.forEach((pair, index) => {
      addDataPair(pair.key, pair.value, index);
    });
  } else {
    // Füge 10 leere Paare hinzu
    for (let i = 0; i < 10; i++) {
      addDataPair('', '');
    }
  }
  
  // Füge Hinzufügen-Button hinzu
  const addButton = document.createElement('button');
  addButton.textContent = '+ Weitere Felder hinzufügen';
  addButton.className = 'data-chamber-action-button';
  addButton.style.marginTop = '10px';
  addButton.addEventListener('click', () => {
    addDataPair('', '');
  });
  dataChamberBody.appendChild(addButton);
  
  // Scroll Indicator
  const scrollIndicator = document.createElement('div');
  scrollIndicator.className = 'scroll-indicator';
  scrollIndicator.textContent = '↓ Scrollen für mehr Felder ↓';
  dataChamberBody.appendChild(scrollIndicator);
}

function addDataPair(key = '', value = '', index = null) {
  const pairContainer = document.createElement('div');
  pairContainer.className = 'data-pair-container';
  
  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.className = 'data-key-input';
  keyInput.placeholder = 'Feldname (z.B. "name", "email")';
  keyInput.value = key;
  
  const valueInput = document.createElement('textarea');
  valueInput.className = 'data-value-input';
  valueInput.placeholder = 'Wert';
  valueInput.value = value;
  
  pairContainer.appendChild(keyInput);
  pairContainer.appendChild(valueInput);
  
  if (index !== null) {
    pairContainer.dataset.index = index;
  }
  
  dataChamberBody.insertBefore(pairContainer, dataChamberBody.lastChild);
}

function saveDataChamber() {
  if (!chats[currentChatId]) return;
  
  const pairs = [];
  const pairContainers = document.querySelectorAll('.data-pair-container');
  
  pairContainers.forEach(container => {
    const key = container.querySelector('.data-key-input').value.trim();
    const value = container.querySelector('.data-value-input').value.trim();
    
    if (key || value) {
      pairs.push({ key, value });
    }
  });
  
  chats[currentChatId].dataPairs = pairs;
  dataChamber.classList.remove('active');
  
  // Optional: Füge eine Nachricht hinzu, dass Daten gespeichert wurden
  addMessage('bot', 'Die Daten wurden erfolgreich in der Datenkammer gespeichert.');
}

// Export-Funktionen
exportButton.addEventListener("click", () => {
  exportOptions.style.display = 
    exportOptions.style.display === "none" ? "flex" : "none";
});

document.querySelectorAll(".export-option").forEach(btn => {
  btn.addEventListener("click", () => {
    exportChatAs(btn.dataset.format);
  });
});

function exportChatAs(format) {
  const chat = chats[currentChatId];
  const messages = chat?.messages ?? [];

  if (format === "json") {
    const data = {
      chatName: chat.name,
      messages: messages,
      dataPairs: chat.dataPairs || []
    };
    downloadFile(`${chat.name}.json`, JSON.stringify(data, null, 2), "application/json");
  } else if (format === "txt") {
    const txt = messages.map(m => `${m.role === "user" ? "DU: " : "BOT: "}${m.content}`).join("\n");
    downloadFile(`${chat.name}.txt`, txt, "text/plain");
  } else if (format === "csv") {
    const csv = "Rolle,Nachricht\n" + 
                messages.map(m => `${m.role},"${m.content.replace(/"/g, '""')}"`).join("\n");
    downloadFile(`${chat.name}.csv`, csv, "text/csv");
  }

  exportOptions.style.display = "none";
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Event Listener
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);
newChatButton.addEventListener("click", () => {
  createChat();
});

// Initialisierung
createChat("Hauptchat");
