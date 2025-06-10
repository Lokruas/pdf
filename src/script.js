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
toggleSidebarButton.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
});

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

  const div = document.createElement("div");
  div.className = role === "user" ? "message-user" : "message-bot";
  div.textContent = content;
  chatOutput.appendChild(div);
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
