let chats = {};
let currentChatId = null;
let chatCounter = 0;
let waitingForFirstMessage = false;

const chatOutput = document.getElementById("chat-output");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const voiceButton = document.getElementById("voice-button");
const uploadButton = document.getElementById("upload-button");
const fileUpload = document.getElementById("file-upload");
const exportButton = document.getElementById("export-button");
const exportOptions = document.getElementById("export-options");
const chatList = document.getElementById("chat-list");
const newChatButton = document.getElementById("new-chat-button");
const toggleSidebarButton = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");

// Sidebar toggeln
toggleSidebarButton.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

// Verlauf anzeigen
function updateChatOutput(chatId) {
  chatOutput.innerHTML = "";
  chats[chatId].messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = msg.role === "user" ? "message-user" : "message-bot";
    div.textContent = msg.content;
    chatOutput.appendChild(div);
  });
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

// Neuen Chat anlegen (mit Platzhaltername)
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
}

// Chatname nachträglich setzen
function updateChatName(id, name) {
  chats[id].name = name;
  const item = [...chatList.children].find(li => parseInt(li.dataset.id) === id);
  if (item) item.textContent = name;
}

// Nachricht hinzufügen
function addMessage(role, content) {
  if (currentChatId === null) {
    createChat(content.substring(0, 20));
  } else if (waitingForFirstMessage && role === "user") {
    updateChatName(currentChatId, content.substring(0, 20));
    waitingForFirstMessage = false;
  }

  chats[currentChatId].messages.push({ role, content });

  const div = document.createElement("div");
  div.className = role === "user" ? "message-user" : "message-bot";
  div.textContent = content;
  chatOutput.appendChild(div);
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

// Nachricht senden
function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  userInput.value = "";

  setTimeout(() => {
    addMessage("bot", `Antwort auf: ${text}`);
  }, 400);
}

// Eingabe mit Enter
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
  updateChatOutput(currentChatId);
});

// Spracherkennung
voiceButton.addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Spracherkennung wird nicht unterstützt.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "de-DE";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = e => {
    const speechText = e.results[0][0].transcript;
    userInput.value = speechText;
    sendMessage();
  };

  recognition.onerror = e => {
    alert("Fehler: " + e.error);
  };

  recognition.start();
});

// Datei-Upload
uploadButton.addEventListener("click", () => fileUpload.click());

fileUpload.addEventListener("change", () => {
  const file = fileUpload.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    userInput.value = e.target.result;
  };
  reader.readAsText(file);
});

// Exportoptionen anzeigen
exportButton.addEventListener("click", () => {
  exportOptions.style.display =
    exportOptions.style.display === "none" ? "flex" : "none";
});

// Datei herunterladen
function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Exportieren
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

// Export Buttons aktivieren
document.querySelectorAll(".export-option").forEach(btn => {
  btn.addEventListener("click", () => {
    exportChatAs(btn.dataset.format);
  });
});
