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
  <name>Implement Whitelist Validations and the POST /send Endpoint</name>
  <files>ec_whatsapp_bot.js</files>
  <action>
    - Parse `receive_whitelist` and `sender_whitelist` from `botConfig`. Default to empty arrays.
    - Hook into `client.on('message')`: Check if `userphone` is in `receive_whitelist`. If not, instantly `msg.reply("You are not in the whitelist.")` and `return`.
    - Create an `app.post('/send', ...)` route.
    - Extract `sender_token`, `userphone`, `text`, and optional `media_path` from `req.body`.
    - IF `sender_token` is not in `sender_whitelist`, return `res.status(403).json({ success: false, error: "Sender not in whitelist" })`.
    - IF `userphone` is not in `receive_whitelist`, return `res.status(403).json({ success: false, error: "Receiver not in whitelist" })`.
    - IF validated: Use `MessageMedia` if `media_path` is present, push via `client.sendMessage()`, and log the message to `chat_session/{userphone}/chat_log.jsonl`.
    - Return `{ success: true }` to the API caller.
  </action>
  <verify>node -c ec_whatsapp_bot.js</verify>
  <done>API handles whitelists perfectly; WhatsApp interceptor rejects unknown phone numbers.</done>
</task>

## Success Criteria
- [ ] Unknown numbers messaging the bot get a "You are not in the whitelist" error and command routing is aborted.
- [ ] API callers with invalid tokens get a 403 Forbidden sender error JSON.
- [ ] API pushes accurately render inside the user's `chat_log.jsonl`.
