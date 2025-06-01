import streamlit as st

# Placeholder für deine KI-Antwortlogik
def get_ai_response(user_input):
    # Hier kannst du GPT-API oder lokales Modell einbinden
    return f"Simulierte Antwort auf: '{user_input}'"

# Streamlit-Oberfläche
st.set_page_config(page_title="Sales Assistant", layout="centered")
st.title("🤖 AI Sales Assistant")

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Eingabe
user_input = st.text_input("Deine Frage:", "")

# Wenn Nutzer etwas eingibt
if user_input:
    st.session_state.chat_history.append(("Du", user_input))
    response = get_ai_response(user_input)
    st.session_state.chat_history.append(("AI", response))

# Chatverlauf anzeigen
for speaker, message in st.session_state.chat_history:
    st.markdown(f"**{speaker}:** {message}")
