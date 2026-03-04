## Phase 2 Decisions

**Date:** 2026-03-04

### Scope
- Implement an API to allow external CLI scripts to asynchronously PUSH texts and media to a WhatsApp user, independently of the user sending a command first.
- The system must only target users who already have an established WhatsApp chat session with the bot account to prevent WhatsApp ban risks.

### Approach
- **Chose:** Option A (Internal HTTP API listening on a Port)
- **Reason:** The user requested the server to run in the *same* process to avoid maintaining two separate daemons. It is highly preferred so external scripts can simply trigger an standard HTTP POST.

### Constraints
- The HTTP Server must be initialized asynchronously alongside the WhatsApp Web client connection in `ec_whatsapp_bot.js`.
- An authentication/security token might be necessary if we eventually want to secure the local API port, but for now, we will simply bind to `localhost`/`127.0.0.1` to prevent external network access blindly triggering WhatsApp messages.
