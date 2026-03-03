---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Core Bot Setup and Routing

## Objective
Implement a persistent generic WhatsApp Bot that logs chat history locally, downloads attached media files reliably, and invokes terminal commands sequentially using predefined mapping, so that CLI tools can integrate directly with WhatsApp seamlessly.

## Context
- `.gsd/SPEC.md`
- `.gsd/ROADMAP.md`
- `.gsd/phases/1/RESEARCH.md`
- `ec_whatsapp_bot.js`
- `config.ini`
- `cmd_mapping.csv`

## Tasks

<task type="auto">
  <name>Configure Session & Local Variables</name>
  <files>ec_whatsapp_bot.js, package.json</files>
  <action>
    - Install the `ini` package to read `config.ini`.
    - Modify the `LocalAuth` provider in `whatsapp-web.js` to store session persistent credentials under `.wwebjs_auth`.
    - Set up the parsing of `cmd_mapping.csv` so it hashes properties by `cmdcode` for O(1) command lookup.
  </action>
  <verify>node -c ec_whatsapp_bot.js</verify>
  <done>Syntax check passes, dictionary maps commands properly over empty arrays.</done>
</task>

<task type="auto">
  <name>Implement Chat Histories and Media Drops</name>
  <files>ec_whatsapp_bot.js</files>
  <action>
    - Create a global `chat_session/{userphone}` folder interceptor that makes sure user isolated subdirectories exist.
    - Setup `chat_log.jsonl` writer inside that directory that appends a log entry every time a message is received or replied to.
    - Write a `msg.downloadMedia()` buffer extractor that drops the media exactly inside `chat_session/{userphone}/` using `timestamp_id.ext` formatting.
  </action>
  <verify>node -c ec_whatsapp_bot.js</verify>
  <done>User session folders are automatically built; logs append accurately inline; media drops as base64 converted to target extension.</done>
</task>

<task type="auto">
  <name>CLI Routing Engine</name>
  <files>ec_whatsapp_bot.js</files>
  <action>
    - Implement a conditional inside `on('message')` to extract a 2-char code and optional rest payload.
    - If valid, dynamically construct `exec()` script taking text argument and optional downloaded absolute media path.
    - Provide a try/catch wrapper on stdout expecting a JSON string like `{"type": "media", "content": "text", "file_path": "/path"}` -> dispatch via `whatsapp-web.js`.
    - Fallback: Output raw text safely to the user on JSON syntax failure.
  </action>
  <verify>node -c ec_whatsapp_bot.js</verify>
  <done>Commands are executed accurately using cwd; CLI returning valid JSONs successfully generate WhatsApp messages.</done>
</task>

## Success Criteria
- [ ] Session is maintained permanently without qr-code rescanning.
- [ ] Log lines build into `chat_session/{phone}/chat_log.jsonl`.
- [ ] CLI correctly parses arguments and media dependencies.
- [ ] Output from bash yields a message successfully handled back to the user's chat.
