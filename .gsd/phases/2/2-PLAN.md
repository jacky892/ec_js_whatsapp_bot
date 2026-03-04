---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Internal API for Outgoing Messages

## Objective
Implement a local HTTP server that acts as a secure reverse-binding to the `whatsapp-web.js` client in memory. It allows external CLI scripts or daemons to `POST` JSON payloads to `http://127.0.0.1:<PORT>/send` and dynamically initiate WhatsApp messages back to users (push notifications and asynchronous reports) without the user messaging the bot first.

## Context
- `.gsd/SPEC.md`
- `.gsd/ROADMAP.md`
- `.gsd/DECISIONS.md`
- `ec_whatsapp_bot.js`
- `package.json`
- `config.ini`

## Tasks

<task type="auto">
  <name>Install Express and Setup Server Logic</name>
  <files>package.json, ec_whatsapp_bot.js</files>
  <action>
    - Install `express` and `body-parser`.
    - At the top of `ec_whatsapp_bot.js`, initialize an Express server `app`.
    - Check `config.ini` for an `api_port` (default: 3000) and `app.listen` on `127.0.0.1` after the client is initialized inside `client.on('ready')`.
  </action>
  <verify>node -c ec_whatsapp_bot.js</verify>
  <done>Express sets up securely, and config.ini controls the listening port explicitly.</done>
</task>

<task type="auto">
  <name>Implement the POST /send Endpoint</name>
  <files>ec_whatsapp_bot.js</files>
  <action>
    - Create an `app.post('/send', ...)` route.
    - Parse `req.body` expecting `userphone`, `text`, and optional `media_path`.
    - Format `userphone` by appending `@c.us` automatically.
    - If `media_path` is provided, use `MessageMedia.fromFilePath(media_path)` and send as caption using `client.sendMessage(numberId, mediaToSend, { caption: text })`. 
    - Otherwise, just `client.sendMessage(numberId, text)`.
    - IMPORTANT: Log the API-sent message into `chat_session/{userphone}/chat_log.jsonl` exactly like normal bot replies! Ensure `getUserSessionDir` is leveraged so the directory exists before logging.
    - Return standard JSON `{ success: true, messageId: ... }` to the HTTP caller upon completion, or capture exceptions cleanly to 500 error messages.
  </action>
  <verify>node -c ec_whatsapp_bot.js</verify>
  <done>API fully handles userphone sanitization, media attachment logic, file system logging, and graceful error messages.</done>
</task>

## Success Criteria
- [ ] The bot exposes a listening port (`localhost:3000` by default).
- [ ] A `curl` request containing a valid JSON payload successfully triggers a WhatsApp message.
- [ ] All push notifications accurately render inside the user's `chat_log.jsonl` for persistency.
