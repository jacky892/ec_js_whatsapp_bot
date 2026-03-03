# Bot Integration Guide for CLI Providers

Welcome! This guide explains how to integrate your custom CLI tool or script with the **Generic WhatsApp Bot Gateway**. By integrating, your CLI script can automatically receive parameters and media via WhatsApp, execute its logic, and send text or media back to the user seamlessly.

---

## 1. How the Bot Calls Your Script

When a user sends a message on WhatsApp that matches your prefix, the Bot Gateway will invoke your script via a subprocess `exec()` call.

The bot parses the user's message into two main components:
1. **The Command Code**: The first 2 characters of the message.
2. **The Parameters**: Everything that follows the first 2 characters.

### Argument Injection
Your script will be executed with the following arguments:

- **Argument 1 (`$1`): The Message Text**
  This contains the `{parameters}` part of the WhatsApp message.
  *Example: If the user sends `im convert to png`, `$1` will be exactly `"convert to png"`.*

- **Argument 2 (`$2`): The Media Path (Optional)**
  If the user attached an image, document, or audio file, the bot downloads it immediately and passes the absolute file path to the local file as `$2`.
  *Example: `/Users/jackylee/aimv/agents/gsd/ec_js_whatsapp_bot/chat_session/123456789/timestamp_msgid.jpeg`*

---

## 2. Setting Up Your Command Mapping

The WhatsApp Bot knows how to route commands by reading a central `cmd_mapping.csv` file located in the bot's root directory.

### The Format
```csv
cmdcode,work_dir,base_cmd,script_name
```
- `cmdcode`: A unique 2-letter prefix for your bot command (e.g., `ai`, `im`, `hr`).
- `work_dir`: The exact folder where your script lives. The bot executes in this directory (`cwd`).
- `base_cmd`: The interpreter (e.g., `bash`, `python3`, `node`).
- `script_name`: The name of your executable file.

### Integration Strategy: Auto-Register via `bot_config.ini`

If you are developing a standalone CLI tool in another directory, a good practice is to ship a `bot_config.ini` with your tool and provide an installation script to register your commands to the gateway's `cmd_mapping.csv` automatically.

**Example `bot_config.ini` in your CLI repo:**
```ini
[BotIntegration]
cmdcode=hr
base_cmd=python3
script_name=cli_runner.py
```

**Example `install_to_bot.sh` script:**
```bash
#!/bin/bash
BOT_GATEWAY_DIR="/Users/jackylee/aimv/agents/gsd/ec_js_whatsapp_bot"
MY_WORK_DIR=$(pwd)
CMD_CODE="hr"
BASE_CMD="python3"
SCRIPT="cli_runner.py"

# Append your tool's entry to the master gateway CSV
echo "$CMD_CODE,$MY_WORK_DIR,$BASE_CMD,$SCRIPT" >> "$BOT_GATEWAY_DIR/cmd_mapping.csv"

echo "Registration complete! You can now type 'hr <command>' in WhatsApp."
```

---

## 3. Required Output Format

For the Bot to reply to the user, your CLI script must output **valid JSON** to `stdout`. Do not print regular text or debug logs to `stdout` (use `stderr` for logging instead). 

The bot parses the `stdout` when your script exits.

### Replying with Text
If your script simply processes data and wants to reply with a text message, emit:
```json
{
  "type": "text",
  "content": "Request processed successfully. 5 records updated."
}
```

### Replying with Media (Images, PDFs, etc.)
If your script generates a report or modifies an image, emit:
```json
{
  "type": "media",
  "content": "Here is the customized PDF report you requested.",
  "file_path": "/absolute/path/to/generated_report.pdf"
}
```
*Note: Make sure the `file_path` is an absolute path to a file that the bot has read access to. `content` will be used as the media caption.*

---

## 4. Full Simple Example (Bash)

Imagine we are building a CLI tool that takes a user's image, renames it, and sends it back to them, or just echoes text back if no image was sent.

**`echo_tool.sh`**
```bash
#!/bin/bash

USER_TEXT="$1"
MEDIA_PATH="$2"

# We must send debug logs to standard error to prevent corrupting the JSON stdout!
echo "Debug: Received text: $USER_TEXT" >&2

if [ -z "$MEDIA_PATH" ]; then
    # Scenario A: User only sent text
    
    # We build our JSON dynamically and pipe it to stdout
    cat <<EOF
{
  "type": "text",
  "content": "You said: $USER_TEXT. But you didn't attach any media!"
}
EOF

else
    # Scenario B: User attached media
    echo "Debug: Media saved at $MEDIA_PATH" >&2
    
    # Do some processing... (e.g., resizing the image, reading the PDF)
    # ...

    # Reply with the media
    cat <<EOF
{
  "type": "media",
  "content": "I received your file! Here is it sent right back to you.",
  "file_path": "$MEDIA_PATH"
}
EOF

fi
```
