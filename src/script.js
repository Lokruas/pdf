let chatHistory = [];
let currentChatId = 0;
const chatOutput = document.getElementById("chat-output");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const voiceButton = document.getElementById("voice-button");
const uploadButton = document.getElementById("upload-button");
const fileUpload = document.getElementById("file-upload");
const exportButton = document.getElementById("export-button");
const chatList = document.getElementById("chat-list");
const newChatButton = document.getElementById("new-chat-button");
const toggleSidebarButton = document.getElementById("toggle-sidebar");
const sidebar = document.getElementById("sidebar");

let chats = {
  0: []
};

// Nachrichtenanzeige
function addMessage(role, content) {
  const messageDiv = document.createElement("div");
  messageDiv.textContent = `${role === "user" ? "Du" : "V.I.T.A.L"}: ${content}`;
  chatOutput.appendChild(messageDiv);
  chatOutput.scrollTop = chatOutput.scrollHeight;

  chats[currentChatId].push({ role, content });
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

// Enter = senden
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);

// Spracherkennung
voiceButton.addEventListener("click", () => {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Spracherkennung wird nicht unterstützt.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "de-DE";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const speechText = event.results[0][0].transcript;
    userInput.value = speechText;
    sendMessage();
  };

  recognition.onerror = (e) => {
    alert("Fehler bei Spracherkennung: " + e.error);
  };

  recognition.start();
});

// Datei-Upload
uploadButton.addEventListener("click", () => {
  fileUpload.click();
});

fileUpload.addEventListener("change", () => {
  const file = fileUpload.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    userInput.value = text;
  };
  reader.readAsText(file);
});

// Export-Funktionen
function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function exportChatAs(format) {
  const currentMessages = chats[currentChatId];

  if (format === "json") {
    downloadFile("chat.json", JSON.stringify(currentMessages, null, 2), "application/json");
  } else if (format === "txt") {
    const txt = currentMessages.map(m => `${m.role === "user" ? "Du" : "V.I.T.A.L"}: ${m.content}`).join("\n");
    downloadFile("chat.txt", txt, "text/plain");
  } else if (format === "csv") {
    const csv = "Role,Message\n" + currentMessages.map(m => `${m.role},\"${m.content}\"`).join("\n");
    downloadFile("chat.csv", csv, "text/csv");
  }
}

exportButton.addEventListener("click", () => {
  const choice = prompt("Exportformat wählen: json, txt, csv").toLowerCase();
  if (["json", "txt", "csv"].includes(choice)) {
    exportChatAs(choice);
  } else {
    alert("Ungültiges Format");
  }
});

// Neuer Chat
newChatButton.addEventListener("click", () => {
  currentChatId++;
  chats[currentChatId] = [];
  chatOutput.innerHTML = "";

  const li = document.createElement("li");
  li.textContent = `Chat ${currentChatId + 1}`;
  li.dataset.id = currentChatId;
  li.addEventListener("click", () => switchChat(parseInt(li.dataset.id)));
  chatList.appendChild(li);
});

// Chat wechseln
function switchChat(id) {
  currentChatId = id;
  chatOutput.innerHTML = "";
  chats[currentChatId].forEach(msg => addMessage(msg.role, msg.content));
}

// Seitenleiste ein-/ausklappen
toggleSidebarButton.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});
