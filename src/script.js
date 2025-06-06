let chats = {
  0: []
};
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

// Nachricht hinzufügen
function addMessage(role, content) {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = `${role === "user" ? "Du" : "V.I.T.A.L"}: ${content}`;
  chatOutput.appendChild(msgDiv);
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

// Eingabe mit Enter
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);

// Spracherkennung (Speech to Text)
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

// Dokument hochladen
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

// Exportieren (json, txt, csv)
function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function exportChatAs(format) {
  const messages = chats[currentChatId];

  if (format === "json") {
    downloadFile("chat.json", JSON.stringify(messages, null, 2), "application/json");
  } else if (format === "txt") {
    const txt = messages.map(m => `${m.role === "user" ? "Du" : "V.I.T.A.L"}: ${m.content}`).join("\n");
    downloadFile("chat.txt", txt, "text/plain");
  } else if (format === "csv") {
    const csv = "Rolle,Nachricht\n" + messages.map(m => `${m.role},"${m.content}"`).join("\n");
    downloadFile("chat.csv", csv, "text/csv");
  }
}

exportButton.addEventListener("click", () => {
  const format = prompt("Exportformat wählen: json, txt, csv").toLowerCase();
  if (["json", "txt", "csv"].includes(format)) {
    exportChatAs(format);
  } else {
    alert("Ungültiges Format");
  }
});

// Sidebar umschalten
toggleSidebarButton.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

// Chat laden
function switchChat(id) {
  currentChatId = id;
  chatOutput.innerHTML = "";
  chats[id].forEach(m => addMessage(m.role, m.content));
}

// Neuen Chat hinzufügen
newChatButton.addEventListener("click", () => {
  currentChatId++;
  chats[currentChatId] = [];

  const li = document.createElement("li");
  li.textContent = `Chat ${currentChatId + 1}`;
  li.dataset.id = currentChatId;
  li.addEventListener("click", () => switchChat(parseInt(li.dataset.id)));
  chatList.appendChild(li);

  chatOutput.innerHTML = "";
});
