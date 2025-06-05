function sendMessage() {
  const input = document.getElementById("user-input");
  const output = document.getElementById("chat-output");

  const userMessage = input.value;
  if (!userMessage) return;

  // Benutzertext anzeigen
  output.innerHTML += `<p><strong>Du:</strong> ${userMessage}</p>`;
  input.value = "";

  // Platzhalter für Bot-Antwort
  // → Hier kannst du später einen echten API-Aufruf zu FastAPI machen
  setTimeout(() => {
    const botReply = "Das ist eine Beispielantwort vom Chatbot.";
    output.innerHTML += `<p><strong>Bot:</strong> ${botReply}</p>`;
  }, 500);
}
