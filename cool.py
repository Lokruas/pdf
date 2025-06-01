def get_ai_response(text):
    return "Dies wäre die KI-Antwort."

while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        break
    response = get_ai_response(user_input)
    print(f"AI: {response}")
