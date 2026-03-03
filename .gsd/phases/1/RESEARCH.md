---
phase: 1
level: 2
researched_at: 2026-03-04
---

# Phase 1 Research: Generic WhatsApp Bot

## Questions Investigated
1. How to reliably persist the WhatsApp Web session without repeatedly scanning QR codes?
2. What are the best practices for structuring custom user chat history data in Node.js?
3. How can we pass both WhatsApp text and media payloads concurrently to a generic bash script securely?
4. How should the response from bash scripts be parsed back to WhatsApp format (Media vs Text)?

## Findings

### Session Persistence (`whatsapp-web.js`)
The `whatsapp-web.js` library provides `LocalAuth` which allows saving session data to the file system. By defining `{ dataPath: './.wwebjs_auth' }`, we ensure the session survives restarts.

**Recommendation:** Utilize `LocalAuth` to store sessions in `.wwebjs_auth`. Document how users can clear this directory to re-authenticate with a new mobile number.

### History & Media Storage Pattern
Storing metadata into a database adds complexity for a "generic" CLI wrapper. For maximum portability, a file-system based approach `chat_session/{userphone}/` is superior. Text history can be appended to a `chat_log.jsonl` (JSON Lines), and media files directly written into the same directory using `fs.writeFileSync`.

**Recommendation:** Use the filesystem structure `chat_session/{userphone}/chat_log.jsonl` along with timestamps for filenames.

### CLI Execution and Routing
The application needs to dynamically look up two-letter command prefixes (e.g. `im`). Using `csv-parse/sync` offers a robust way to map CLI settings from `cmd_mapping.csv`. To pass data, `child_process.exec` should run the script, passing the text payload as `$1` and the optional absolute media path as `$2`.

**Recommendation:** Map CSV to an in-memory dictionary. Use string interpolation cautiously for `exec`.

### Response Parsing
Subprocesses need an un-ambiguous way to communicate if they are sending text or a file path back to WhatsApp. The standard output (stdout) should be a JSON string that the Node script parses.

**Recommendation:** CLI scripts should output JSON: `{"type": "media", "content": "text", "file_path": "/path"}` or `{"type": "text", "content": "hello"}`.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Storage | `.wwebjs_auth` directory | Native to the library; avoids third-party DB. |
| User Segregation | `chat_session/{phone}/` | Flat file structure makes it easy for sysadmins to debug. |
| Configuration | `config.ini` & `cmd_mapping.csv` | Clear separation between connection config and runtime bot logic. |
| Subprocess API | JSON string over stdout | Simplifies outputting rich objects to the JS layer over plain text. |

## Patterns to Follow
- Parse stdout as JSON with a try-catch block to gracefully fallback to returning raw text on JSON parse failure.
- Validate mimetype and extension properly while writing Base64 media arrays from `whatsapp-web.js` to disk.

## Anti-Patterns to Avoid
- Storing configurations inside JS source code. Keep logic generic.
- Passing user input directly into `exec` without quoting (risk of bash injection).
- Using global namespace for per-message data flows.

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| `whatsapp-web.js` | `^1.34.6` | Core WhatsApp communication |
| `qrcode-terminal` | latest | Rendering auth QR in CLI |
| `csv-parse` | latest | Fast sync parsing for routing table |
| `ini` | latest | Parsing `config.ini` file securely |

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
