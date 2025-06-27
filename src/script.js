// Zustandsvariablen
let chats = {};
let currentChatId = null;
let chatCounter = 0;
let waitingForFirstMessage = false;
let jumpTitles = {};

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
const dataChamberButton = document.getElementById("data-chamber-button");
const dataChamber = document.getElementById("data-chamber");
const dataChamberClose = document.getElementById("data-chamber-close");
const dataChamberInfoButton = document.getElementById("data-chamber-info-button");
const dataChamberInfo = document.getElementById("data-chamber-info");

// Event Listener für Sidebars
if (toggleSidebarButton) {
  toggleSidebarButton.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });
}

if (toggleJumpsSidebarButton) {
  toggleJumpsSidebarButton.addEventListener("click", () => {
    chatJumpsSidebar.classList.toggle("collapsed");
  });
}

if (closeJumpsSidebarButton) {
  closeJumpsSidebarButton.addEventListener("click", () => {
    chatJumpsSidebar.classList.add("collapsed");
  });
}

// Chat-Funktionen
function createChat(name = null) {
  try {
    const id = chatCounter++;
    chats[id] = { 
      name: name || `Chat ${id + 1}`, 
      messages: [],
      jumpTitles: {},
      dataPairs: [] // Neu hinzugefügt für Datenkammer
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
    
    if (chatList) {
      chatList.appendChild(li);
      chatJumpsList.innerHTML = "";
      updateChatDisplay(currentChatId);
    }
  } catch (error) {
    console.error("Fehler in createChat:", error);
  }
}

function updateChatDisplay(chatId) {
  if (!chatOutput || !chatJumpsList) return;
  
  chatOutput.innerHTML = "";
  chatJumpsList.innerHTML = "";

  if (!chats[chatId]) return;

  chats[chatId].messages.forEach((msg, index) => {
    addMessageToOutput(msg.role, msg.content, index);

    if (msg.role === "user") {
      addJumpItem(chatId, index, msg.content);
    }
  });

  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function updateChatName(chatId, newName) {
  if (!chats[chatId]) return;
  chats[chatId].name = newName;
  
  const chatItem = document.querySelector(`#chat-list li[data-id="${chatId}"]`);
  if (chatItem) {
    chatItem.textContent = newName;
  }
}

function addMessageToOutput(role, content, index) {
  if (!chatOutput) return;

  if (role === "user") {
    const div = document.createElement("div");
    div.className = "message-user";
    div.textContent = content;
    div.dataset.messageIndex = index;
    chatOutput.appendChild(div);
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

    chatOutput.appendChild(botMessage);
  }
}

function addJumpItem(chatId, messageIndex, originalContent) {
  if (!chatJumpsList) return;

  const jumpItem = document.createElement("li");
  jumpItem.className = "jump-item";

  const contentSpan = document.createElement("span");
  contentSpan.className = "jump-item-content";

  const displayText = chats[chatId].jumpTitles[messageIndex] || 
                     originalContent.substring(0, 50) + 
                     (originalContent.length > 50 ? "..." : "");
  contentSpan.textContent = displayText;

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "jump-item-actions";

  const editButton = document.createElement("button");
  editButton.innerHTML = "✏️";
  editButton.title = "Titel bearbeiten";
  editButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showEditTitleDialog(chatId, messageIndex, displayText);
  });

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
  if (!editTitleDialog || !editTitleInput) return;

  editTitleInput.value = currentTitle;
  editTitleDialog.style.display = "block";

  const saveHandler = () => {
    const newTitle = editTitleInput.value.trim();
    if (newTitle) {
      chats[chatId].jumpTitles[messageIndex] = newTitle;
      
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
    if (chats[chatId].jumpTitles[messageIndex]) {
      delete chats[chatId].jumpTitles[messageIndex];
    }
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
  try {
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
        const botResponseIndex = chats[currentChatId].messages.length;
        const botResponse = generateBotResponse(content);
        chats[currentChatId].messages.push({ role: "bot", content: botResponse });
        addMessageToOutput("bot", botResponse, botResponseIndex);
      }, 400);
    }

    if (chatOutput) {
      chatOutput.scrollTop = chatOutput.scrollHeight;
    }
  } catch (error) {
    console.error("Fehler in addMessage:", error);
  }
}

function generateBotResponse(userMessage) {
  return `Ich habe Ihre Nachricht erhalten: "${userMessage}". Wie kann ich Ihnen weiterhelfen?`;
}

function sendMessage() {
  try {
    if (!userInput) return;
    
    const text = userInput.value.trim();
    if (!text) return;

    addMessage("user", text);
    userInput.value = "";
  } catch (error) {
    console.error("Fehler in sendMessage:", error);
  }
}

// Event Listener
if (userInput) {
  userInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

if (sendButton) {
  sendButton.addEventListener("click", sendMessage);
}

if (newChatButton) {
  newChatButton.addEventListener("click", () => {
    createChat();
  });
}

// Export-Funktionen
if (exportButton) {
  exportButton.addEventListener("click", () => {
    if (exportOptions) {
      exportOptions.style.display = 
        exportOptions.style.display === "none" ? "flex" : "none";
    }
  });
}

document.querySelectorAll(".export-option").forEach(btn => {
  btn.addEventListener("click", () => {
    exportChatAs(btn.dataset.format);
  });
});

function exportChatAs(format) {
  try {
    const chat = chats[currentChatId];
    if (!chat) return;
    
    const messages = chat.messages || [];

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

    if (exportOptions) {
      exportOptions.style.display = "none";
    }
  } catch (error) {
    console.error("Fehler in exportChatAs:", error);
  }
}

function downloadFile(filename, content, type) {
  try {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  } catch (error) {
    console.error("Fehler in downloadFile:", error);
  }
}

// Datenkammer-Funktionen
if (dataChamberButton) {
  dataChamberButton.addEventListener("click", () => {
    if (dataChamber) {
      dataChamber.style.display = "flex";
      initializeDataChamber();
    }
  });
}

if (dataChamberClose) {
  dataChamberClose.addEventListener("click", () => {
    if (dataChamber) {
      dataChamber.style.display = "none";
    }
  });
}

if (dataChamberInfoButton) {
  dataChamberInfoButton.addEventListener("click", () => {
    if (dataChamberInfo) {
      dataChamberInfo.style.display = dataChamberInfo.style.display === "none" ? "block" : "none";
    }
  });
}

function initializeDataChamber() {
  // Implementierung der Datenkammer-Initialisierung
}

// Initialisierung
document.addEventListener("DOMContentLoaded", () => {
  createChat("Hauptchat");
});
