// Button-Funktionen registrieren
document.getElementById('send-button').addEventListener('click', handleSubmit);
document.getElementById('voice-button').addEventListener('click', startVoiceInput);
document.getElementById('upload-button').addEventListener('click', uploadDocument);
document.getElementById('user-input').addEventListener('keydown', handleKeyPress);

// Funktion zum Absenden der Nachricht
function handleSubmit() {
  const input = document.getElementById("user-input");
  const output = document.getElementById("chat-output");

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Nutzer-Nachricht anzeigen
  output.innerHTML += `<p><strong>Du:</strong> ${userMessage}</p>`;
  input.value = "";

  // Platzhalter für Chatbot-Antwort
  setTimeout(() => {
    const botReply = "Das ist eine Beispielantwort vom Chatbot.";
    output.innerHTML += `<p><strong>V.I.T.A.L:</strong> ${botReply}</p>`;
    output.scrollTop = output.scrollHeight; // Automatisch nach unten scrollen
  }, 500);
}

// Nachricht senden mit Enter (Shift+Enter = Zeilenumbruch)
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // Verhindert normalen Zeilenumbruch
    handleSubmit();
  }
}

// Dummyfunktion für Spracheingabe
function startVoiceInput() {
  alert("Spracherkennung gestartet (Demofunktion)");
}

// Dummyfunktion für Dokument-Upload
function uploadDocument() {
  alert("Dokument hochladen (Demofunktion)");
}
