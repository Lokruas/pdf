let chats = {};
let currentChatId = null;
let chatCounter = 0;
let waitingForFirstMessage = false;

const chatOutput = document.getElementById("chat-output");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const exportButton = document.getElementById("export-button");
const exportOptions = document.getElementById("export-options");
const chatList = document.getElementById("chat-list");
const newChatButton = document.getElementById("new-chat-button");
const toggleSidebarButton = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");
const chatJumpsList = document.getElementById("chat-jumps-list");

toggleSidebarButton.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

function updateChatOutput(chatId) {
  chatOutput.innerHTML = "";
  chatJumpsList.innerHTML = "";
  
  if (!chats[chatId]) return;
  
  chats[chatId].messages.forEach((msg, index) => {
    // Nachricht im Hauptbereich anzeigen
    const div = document.createElement("div");
    div.className = msg.role === "user" ? "message-user" : "message-bot";
    div.textContent = msg.content;
    div.dataset.messageIndex = index;
    chatOutput.appendChild(div);
    
    // Eintrag in Chatsprünge-Sidebar hinzufügen (nur Nutzernachrichten)
    if (msg.role === "user") {
      const jumpItem = document.createElement("li");
      jumpItem.textContent = msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : "");
      jumpItem.dataset.messageIndex = index;
      jumpItem.addEventListener("click", () => {
        scrollToMessage(chatId, index);
      });
      chatJumpsList.appendChild(jumpItem);
    }
  });
  
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function scrollToMessage(chatId, messageIndex) {
  const messages = document.querySelectorAll("#chat-output > div");
  if (messages.length > messageIndex) {
    messages[messageIndex].scrollIntoView({ behavior: "smooth" });
  }
}

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
  
  // Leere die Chatsprünge-Sidebar für neuen Chat
  chatJumpsList.innerHTML = "";
}

function updateChatName(id, name) {
  chats[id].name = name;
  const item = [...chatList.children].find(li => parseInt(li.dataset.id) === id);
  if (item) item.textContent = name;
}

function addMessage(role, content) {
  if (currentChatId === null) {
    createChat(content.substring(0, 20));
  } else if (waitingForFirstMessage && role === "user") {
    updateChatName(currentChatId, content.substring(0, 20));
    waitingForFirstMessage = false;
  }

  chats[currentChatId].messages.push({ role, content });

  // Nachricht im Hauptbereich anzeigen
  const div = document.createElement("div");
  div.className = role === "user" ? "message-user" : "message-bot";
  div.textContent = content;
  div.dataset.messageIndex = chats[currentChatId].messages.length - 1;
  chatOutput.appendChild(div);
  
  // Bei Nutzernachrichten auch in Chatsprünge-Sidebar hinzufügen
  if (role === "user") {
    const jumpItem = document.createElement("li");
    jumpItem.textContent = content.substring(0, 50) + (content.length > 50 ? "..." : "");
    jumpItem.dataset.messageIndex = chats[currentChatId].messages.length - 1;
    jumpItem.addEventListener("click", () => {
      scrollToMessage(currentChatId, chats[currentChatId].messages.length - 1);
    });
    chatJumpsList.appendChild(jumpItem);
  }
  
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  userInput.value = "";

  setTimeout(() => {
    addMessage("bot", `${text}`);
  }, 400);
}

userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);
newChatButton.addEventListener("click", () => {
  createChat();
  updateChatOutput(currentChatId);
});
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
    const csv = "Rolle,Nachricht\n" + messages.map(m => `${m.role},"${m.content}"`).join("\n");
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
