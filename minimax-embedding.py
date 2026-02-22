import requests

api_key = "your_api_key"

url = "https://api.minimax.io/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Input Chinese text
chinese_text = input("Please enter the Chinese short drama script: ")

payload = {
    "model": "MiniMax-M1",
    "messages": [
        {
            "role": "system",
            "name": "Translator",
            "content": "You are a screenwriter skilled in translation. Please translate the user's Chinese input into English, keeping it colloquial, close to short drama dialogue, not a literal translation, and natural and smooth."
        },
        {
            "role": "user",
            "name": "User",
            "content": chinese_text
        }
    ]
}

response = requests.post(url, headers=headers, json=payload)

print("Status Code:", response.status_code)
print("Result:")
print(response.text)
