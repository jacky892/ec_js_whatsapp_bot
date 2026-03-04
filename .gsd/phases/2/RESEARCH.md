---
phase: 2
level: 2
researched_at: 2026-03-04
---

# Phase 2 Research: Outgoing API & Whitelist Controls

## Questions Investigated
1. How to securely listen for outgoing pushes from CLI scripts without running a second node process?
2. What are the best practices for controlling who the bot will message (Receiver Whitelisting)?
3. How to authenticate local services calling the push API (Sender Whitelisting)?

## Findings

### Internal Push Architecture
Express.js can attach to the same Node.js event loop as `whatsapp-web.js`. The Bot can configure `app.listen()` inside the `client.on('ready')` event. This allows the API to directly access the authenticated `client` instance to call `sendMessage()`.

**Recommendation:** Spin up a lightweight Express API within the existing bot script that exposes a `POST /send` endpoint. 

### Receiver Whitelist Enforcement
Any robust bot requires a barrier against spamming unrecognized numbers. WhatsApp Web JS expects the target number ID (e.g. `85212345678@c.us`).

**Recommendation:** Add `receive_whitelist` as a comma-separated key inside `config.ini`. Update the `client.on('message')` handler and the `POST /send` handler to verify `userphone` against this list. If unauthorized:
- During a WhatsApp message: Reply via standard chat with *"You are not in the whitelist."*
- During an API invoke: Ignore the push and log internally.

### Sender Whitelist Logic 
Since the API operates on standard HTTP, caller services should provide a token.

**Recommendation:** Define `sender_whitelist` in `config.ini`. API callers must pass this inside the JSON payload logic (e.g., `"sender_token": "my-secret-token"`). The API validates this token before processing.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Push Architecture | Internal Express API | Single process; easy sharing of the `client` object. |
| API Identity | Token in JSON Payload | Simple for curl/bash scripts compared to JWT or deep headers. |
| Whitelist Policy | Hardcoded `config.ini` arrays | Easily parsed by `ini` package and hot-swappable on restart. |

## Patterns to Follow
- Reply with a strict HTTP 403 JSON (`{ "success": false, "error": "Sender not in whitelist" }`) when API tokens do not correspond to the configuration.
- Automatically reply with "You are not in the whitelist" on WhatsApp for invalid message requests.

## Anti-Patterns to Avoid
- Exposing the API without token validation, even locally, to prevent arbitrary code on the server executing unintended pushes.

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | `^4.x` | Listen for POST requests |
| `body-parser` | latest | Handle JSON payloads from callers |

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
