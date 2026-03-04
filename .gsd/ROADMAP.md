# Roadmap

## Phase 1: Generic WhatsApp Bot
**Status**: ✅ Complete
Implement the core WhatsApp bot wrapper. Establish session persistence, config parsing (`config.ini`, `cmd_mapping.csv`), per-user file structure for storing text/media, and secure subprocess execution with JSON parsing for stdout responses.

## Phase 2: Outgoing Messaging (Push Notifications/SMS)
Implement an asynchronous mechanism to send WhatsApp messages to users without requiring them to initiate the chat first. Evaluated approaches include polling a local directory for JSON payload files, or establishing an internal HTTP API server.
