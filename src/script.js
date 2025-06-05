document.getElementById('send-button').addEventListener('click', handleSubmit);
document.getElementById('voice-button').addEventListener('click', startVoiceInput);
document.getElementById('upload-button').addEventListener('click', uploadDocument);
document.getElementById('database-button').addEventListener('click', openDatabase);

function handleSubmit() {
  const input = document.getElementById("user-input");
  const output = document.getElementById("chat-output");

  const userMessage = input.value.trim();
  if (!userMessage) return;

  output.innerHTML += `<p><strong>Du:</strong> ${userMessage}</p>`;
  input.value = "";

  // Platzhalter für Bot-Antwort
  setTimeout(() => {
    const botReply = "Das ist eine Beispielantwort vom Chatbot.";
    output.innerHTML += `<p><strong>Bot:</strong> ${botReply}</p>`;
  }, 500);
}

function startVoiceInput() {
  alert("Spracherkennung gestartet (Demofunktion)");
}

function uploadDocument() {
  alert("Dokument hochladen (Demofunktion)");
}

function openDatabase() {
  alert("Datenbankansicht öffnen (Demofunktion)");
}
