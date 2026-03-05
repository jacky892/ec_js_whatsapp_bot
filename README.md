# Generic WhatsApp CLI Bot

This is a generic WhatsApp Bot built with `whatsapp-web.js` designed to forward commands received via WhatsApp to underlying Command Line Interface (CLI) scripts and return the results directly back to the user on WhatsApp.

## Features
- **Session Persistence**: Scan the QR code once. The session is saved to `.wwebjs_auth/` so you don't need to rescan upon reboot.
- **Persistent Chat History**: Maintains a JSONL chat log (`chat_log.jsonl`) for each user in `chat_session/{userphone}/`.
- **Media Support**: Automatically downloads incoming media to the user's chat session folder and can forward the absolute file path to CLI scripts.
- **Customizable Command Routing**: Use `cmd_mapping.csv` to route specific 2-letter prefixes to any shell script.
- **Rich Responses**: The CLI scripts can return JSON to send text or media files back onto WhatsApp.

## Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the bot:
   ```bash
   node ec_whatsapp_bot.js
   ```

## Setup & First Time Login
The first time you run the bot, it will output a QR code to the terminal.
1. Open WhatsApp on your primary phone.
2. Go to Linked Devices -> Link a Device.
3. Scan the QR code.

> **Note**: The session is securely saved in the `.wwebjs_auth` folder. If you ever need to link a different mobile number or if the session is corrupted, **delete the `.wwebjs_auth` directory** and restart the bot to generate a new QR code.

## Configuration

### `config.ini`
You can define global bot configurations here.
```ini
mobile_num=85212345678
```

### `cmd_mapping.csv`
Defines how incoming WhatsApp messages are routed to your server's CLI scripts.
```csv
cmdcode,work_dir,base_cmd,script_name
pf,.,bash,pdf.sh
im,.,bash,img.sh
```

- **`cmdcode`**: A 2-letter prefix the user must type in WhatsApp. (e.g., `pf`)
- **`work_dir`**: The working directory where the script will be executed.
- **`base_cmd`**: The executable (e.g., `bash`, `python3`, `node`).
- **`script_name`**: The script to execute.

## Usage Workflow

When a user messages the bot, the bot checks the first two characters.
If a user sends:
```
im convert
```
And attaches an image.

The bot will execute the following command in the terminal:
```bash
bash img.sh "convert" "/absolute/path/to/chat_session/1234567890/1680000000_id.jpeg"
```

## CLI Response Format
The CLI script (`img.sh` or `pdf.sh`) must output a **JSON string** to `stdout`.

**To send Media back to the user:**
```json
{
 "type": "media",
 "content": "Here is the converted image.",
 "file_path": "/absolute/path/to/output_image.jpg"
}
```

**To send Text back to the user:**
```json
{
 "type": "text",
 "content": "The operation was successful and the database has been updated."
}
```

*If the CLI outputs raw text instead of JSON, the bot will simply forward that raw text back to the user as a fallback.*
