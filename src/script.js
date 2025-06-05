document.getElementById('send-button').addEventListener('click', handleSubmit);
document.getElementById('voice-button').addEventListener('click', startVoiceInput);
document.getElementById('upload-button').addEventListener('click', () => {
  document.getElementById('file-upload').click();
});
document.getElementById('file-upload').addEventListener('change', handleFileUpload);
document.getElementById('user-input').addEventListener('keydown', handleKeyPress);

function handleSubmit() {
  const input = document.getElementById("user-input");
  const output = document.getElementById("chat-output");
  const userMessage = input.value.trim();
  if (!userMessage) return;

  output.innerHTML += `<p><strong>Du:</strong> ${userMessage}</p>`;
  input.value = "";

  setTimeout(() => {
    const botReply = "Das ist eine Beispielantwort vom Chatbot.";
    output.innerHTML += `<p><strong>V.I.T.A.L:</strong> ${botReply}</p>`;
    output.scrollTop = output.scrollHeight;
  }, 500);
}

function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSubmit();
  }
}

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
    // Für .docx/.pdf braucht man zusätzliche Parser (z. B. mit external libs)
  }
}
