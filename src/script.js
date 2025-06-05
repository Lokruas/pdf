body {
  font-family: 'Segoe UI', sans-serif;
  background-color: #f9fafa;
  margin: 0;
  padding: 0;
}

header {
  background-color: #061B2B;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-icon {
  height: 130px;
  width: auto;
  border-radius: 50%;
}

#chat-container {
  max-width: 800px;
  margin: 40px auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
}

#chat-container h1 {
  font-size: 22px;
  font-style: italic;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

#chat-output {
  min-height: 150px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  background: #f9f9f9;
  overflow-y: auto;
}

#input-area {
  display: flex;
  align-items: stretch;
  gap: 10px;
  margin-bottom: 20px;
}

#user-input {
  flex: 1;
  height: 80px;
  padding: 10px;
  font-size: 16px;
  resize: none;
}

#send-button {
  background-color: #0d2d57;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.icon-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.icon-buttons button {
  background-color: #00aa99;
  color: white;
  padding: 10px 15px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
