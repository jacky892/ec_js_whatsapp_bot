# Example test:
curl -X POST http://127.0.0.1:3000/send \
  -H "Content-Type: application/json" \
  -d '{ "sender_token": "my-secret-token", "userphone": "61478837928", "text": "Testing background API push." }'

