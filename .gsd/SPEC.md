# Project Specification

## Goal
Build a generic WhatsApp Bot that maintains persistent chat history, saves media, and acts as a generic bridge to execute server-side CLI scripts based on customizable commands.

## Requirements
- Session persistence using `whatsapp-web.js` LocalAuth.
- Configuration loaded from `config.ini`.
- Commands mapped to scripts using `cmd_mapping.csv`.
- Maintain user chat logs in JSON lines: `chat_session/{userphone}/chat_log.jsonl`.
- Download media to `chat_session/{userphone}/{timestamp}_{id}.{ext}`.
- Execute CLI scripts with `subprocess.exec` passing text as `$1` and media path as `$2`.
- Read JSON responses from CLI to return rich text/media to WhatsApp.

## Phase 2 Additions
- Internal HTTP API (Express.js) listening on `127.0.0.1`.
- `POST /send` endpoint that accepts JSON `{"userphone": "...", "text": "...", "media_path": "..."}`.
- Relies on existing `whatsapp-web.js` client reference in memory.
- Logs outgoing push notifications into the respective `chat_session/{userphone}/chat_log.jsonl` just like normal replies.

Status: FINALIZED
