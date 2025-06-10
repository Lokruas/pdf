let chats = {};
let currentChatId = null;
let chatCounter = 0;
let waitingForFirstMessage = false;
let editingMessageIndex = null;

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

// Chat-Funktionen
function createChat(name = null) {
  const id = chatCounter++;
  chats[id] = { name: name || `Chat ${id + 1}`, messages: [] };
  currentChatId = id;
  waitingForFirstMessage = !name;

  const li = document.createElement("li");
  li.textContent = chats[id].name;
  li.dataset.id = id;
  li.addEventListener("click", () => {
    currentChatId = parseInt(li.dataset.id);
    waitingForFirstMessage = false;
    updateChatOutput(currentChatId);
  });
  chatList.appendChild(li);
  
  chatJumpsList.innerHTML = "";
  updateChatOutput(currentChatId);
}

function updateChatName(id, name) {
  chats[id].name = name;
  const item = [...chatList.children].find(li => parseInt(li.dataset.id) === id);
  if (item) item.textContent = name;
}

function updateChatOutput(chatId) {
  chatOutput.innerHTML = "";
  chatJumpsList.innerHTML = "";
  
  if (!chats[chatId]) return;
  
  chats[chatId].messages.forEach((msg, index) => {
    addMessageToOutput(msg.role, msg.content, index, false);
    
    if (msg.role === "user") {
      addJumpItem(chatId, index, msg.content);
    }
  });
  
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function addMessage(role, content) {
  if (currentChatId === null) {
    createChat(content.substring(0, 20));
  } else if (waitingForFirstMessage && role === "user") {
    updateChatName(currentChatId, content.substring(0, 20));
    waitingForFirstMessage = false;
  }

  const messageIndex = chats[currentChatId].messages.length;
  chats[currentChatId].messages.push({ role, content });
  
  addMessageToOutput(role, content, messageIndex, true);
  
  if (role === "user") {
    addJumpItem(currentChatId, messageIndex, content);
    
    // Automatische Bot-Antwort simulieren
    setTimeout(() => {
      const botResponseIndex = chats[currentChatId].messages.length;
      chats[currentChatId].messages.push({ role: "bot", content: `Antwort auf: ${content}` });
      addMessageToOutput("bot", `Antwort auf: ${content}`, botResponseIndex, true);
    }, 400);
  }
}

function addMessageToOutput(role, content, index, scroll = true) {
  const div = document.createElement("div");
  div.className = role === "user" ? "message-user" : "message-bot";
  div.textContent = content;
  div.dataset.messageIndex = index;
  chatOutput.appendChild(div);
  
  if (scroll) {
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }
}

function addJumpItem(chatId, messageIndex, content) {
  const jumpItem = document.createElement("li");
  jumpItem.className = "jump-item";
  
  const contentSpan = document.createElement("span");
  contentSpan.className = "jump-item-content";
  contentSpan.textContent = content.substring(0, 50) + (content.length > 50 ? "..." : "");
  
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "jump-item-actions";
  
  const editButton = document.createElement("button");
  editButton.innerHTML = "✏️";
  editButton.title = "Bearbeiten";
  editButton.addEventListener("click", (e) => {
    e.stopPropagation();
    showEditDialog(chatId, messageIndex, content);
  });
  
  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "🗑️";
  deleteButton.title = "Löschen";
  deleteButton.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteMessage(chatId, messageIndex);
  });
  
  actionsDiv.appendChild(editButton);
  actionsDiv.appendChild(deleteButton);
  
  jumpItem.appendChild(contentSpan);
  jumpItem.appendChild(actionsDiv);
  
  jumpItem.addEventListener("click", () => {
    scrollToMessage(chatId, messageIndex);
  });
  
  chatJumpsList.appendChild(jumpItem);
}

function showEditDialog(chatId, messageIndex, currentContent) {
  editingMessageIndex = messageIndex;
  
  const dialog = document.createElement("div");
  dialog.className = "edit-dialog";
  
  dialog.innerHTML = `
    <h3>Nachricht bearbeiten</h3>
    <input type="text" id="edit-message-input" value="${currentContent.replace(/"/g, '&quot;')}">
    <div class="edit-dialog-buttons">
      <button id="save-edit">Speichern</button>
      <button id="cancel-edit">Abbrechen</button>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  document.getElementById("save-edit").addEventListener("click", () => {
    const newContent = document.getElementById("edit-message-input").value.trim();
    if (newContent) {
      updateMessage(chatId, messageIndex, newContent);
    }
    document.body.removeChild(dialog);
  });
  
  document.getElementById("cancel-edit").addEventListener("click", () => {
    document.body.removeChild(dialog);
  });
}

function updateMessage(chatId, messageIndex, newContent) {
  chats[chatId].messages[messageIndex].content = newContent;
  
  // Update in der Hauptansicht
  const messageDivs = document.querySelectorAll("#chat-output > div");
  if (messageDivs.length > messageIndex) {
    messageDivs[messageIndex].textContent = newContent;
  }
  
  // Update in der Chatsprünge-Sidebar
  const jumpItems = document.querySelectorAll("#chat-jumps-list .jump-item");
  if (jumpItems.length > messageIndex) {
    jumpItems[messageIndex].querySelector(".jump-item-content").textContent = 
      newContent.substring(0, 50) + (newContent.length > 50 ? "..." : "");
  }
}

function deleteMessage(chatId, messageIndex) {
  if (confirm("Möchten Sie diese Nachricht wirklich löschen?")) {
    chats[chatId].messages.splice(messageIndex, 1);
    updateChatOutput(chatId);
  }
}

function scrollToMessage(chatId, messageIndex) {
  const messages = document.querySelectorAll("#chat-output > div");
  if (messages.length > messageIndex) {
    messages[messageIndex].scrollIntoView({ behavior: "smooth" });
  }
}

// Nachricht senden
function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  userInput.value = "";
}

userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);

// Neuer Chat
newChatButton.addEventListener("click", () => {
  createChat();
});

// Export-Funktionen
exportButton.addEventListener("click", () => {
  exportOptions.style.display =
    exportOptions.style.display === "none" ? "flex" : "none";
});

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function exportChatAs(format) {
  const chat = chats[currentChatId];
  const messages = chat?.messages ?? [];

  if (format === "json") {
    downloadFile(`${chat.name}.json`, JSON.stringify(messages, null, 2), "application/json");
  } else if (format === "txt") {
    const txt = messages.map(m => `${m.role === "user" ? "DU: " : ""}${m.content}`).join("\n");
    downloadFile(`${chat.name}.txt`, txt, "text/plain");
  } else if (format === "csv") {
    const csv = "Rolle,Nachricht\n" + messages.map(m => `${m.role},"${m.content.replace(/"/g, '""')}"`).join("\n");
    downloadFile(`${chat.name}.csv`, csv, "text/csv");
  }

  exportOptions.style.display = "none";
}

document.querySelectorAll(".export-option").forEach(btn => {
  btn.addEventListener("click", () => {
    exportChatAs(btn.dataset.format);
  });
});

// Initialen Chat erstellen
createChat("Hauptchat");
