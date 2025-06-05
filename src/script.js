// Globale Variablen
let chats = [];
let currentChatId = null;

// Initialisierung
document.getElementById('send-button').addEventListener('click', handleSubmit);
document.getElementById('voice-button').addEventListener('click', startVoiceInput);
document.getElementById('upload-button').addEventListener('click', () => {
  document.getElementById('file-upload').click();
});
document.getElementById('file-upload').addEventListener('change', handleFileUpload);
document.getElementById('user-input').addEventListener('keydown', handleKeyPress);
document.getElementById('new-chat-button').addEventListener('click', createNewChat);
document.getElementById('export-button').addEventListener('click', exportAsJSON);

window.onload = () => {
  createNewChat();
};

// Nachrichten senden
function handleSubmit() {
  const input = document.getElementById("user-input");
  const output = document.getElementById("chat-output");
  const userMessage = input.value.trim();
  if (!userMessage || currentChatId === null) return;

  const chat = chats.find(c => c.id === currentChatId);
  const timestamp = new Date().toISOString();
  chat.messages.push({ from: "user", text: userMessage, time: timestamp });

  output.innerHTML += `<p><strong>Du:</strong> ${userMessage}</p>`;
  input.value = "";

  setTimeout(() => {
    const botReply = "Das ist eine Beispielantwort vom Chatbot.";
    chat.messages.push({ from: "bot", text: botReply, time: new Date().toISOString() });
    output.innerHTML += `<p><strong>V.I.T.A.L:</strong> ${botReply}</p>`;
    output.scrollTop = output.scrollHeight;
  }, 500);
}

// Enter-Taste
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSubmit();
  }
}

// Spracherkennung (Chrome)
function startVoiceInput() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Spracherkennung wird in diesem Browser nicht unterstützt.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "de-DE";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.start();

  recognition.onresult = function (event) {
    const result = event.results[0][0].transcript;
    document.getElementById("user-input").value = result;
    handleSubmit();
  };

  recognition.onerror = function (event) {
    alert("Fehler bei der Spracherkennung: " + event.error);
  };
}

// Datei-Upload (.txt)
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const content = e.target.result;
    document.getElementById("user-input").value = content;
  };

  if (file.type === "text/plain") {
    reader.readAsText(file);
  } else {
    alert("Nur .txt-Dateien werden aktuell unterstützt.");
  }
}

// Neuer Chat
function createNewChat() {
  const newId = Date.now();
  const chat = {
    id: newId,
    title: `Chat ${chats.length + 1}`,
    messages: []
  };
  chats.push(chat);
  currentChatId = newId;
  updateSidebar();
  resetChatView();
}

// Seitenleiste aktualisieren
function updateSidebar() {
  const list = document.getElementById('chat-list');
  list.innerHTML = "";

  chats.forEach(chat => {
    const li = document.createElement('li');
    li.textContent = chat.title;
    li.onclick = () => {
      currentChatId = chat.id;
      resetChatView();
      reloadMessages();
    };
    if (chat.id === currentChatId) {
      li.style.backgroundColor = "#b5e0e4";
    }
    list.appendChild(li);
  });
}

// Chatbereich zurücksetzen
function resetChatView() {
  document.getElementById("chat-output").innerHTML = "";
  document.getElementById("user-input").value = "";
}

// Nachrichten laden
function reloadMessages() {
  const output = document.getElementById("chat-output");
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  output.innerHTML = "";
  chat.messages.forEach(m => {
    output.innerHTML += `<p><strong>${m.from === "user" ? "Du" : "V.I.T.A.L"}:</strong> ${m.text}</p>`;
  });
  output.scrollTop = output.scrollHeight;
}

// Export als JSON
function exportAsJSON() {
  const chat = chats.find(c => c.id === currentChatId);
  if (!chat) return;

  const json = JSON.stringify(chat.messages, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${chat.title.replace(/\s/g, "_")}.json`;
  link.click();
}
