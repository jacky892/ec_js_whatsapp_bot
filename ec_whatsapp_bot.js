const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const ini = require('ini');
const { jsonrepair } = require('jsonrepair');
const express = require('express');
const bodyParser = require('body-parser');

const DEBUG = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

// 1. Load Configurations
// Load INI config
const configPath = path.join(__dirname, 'config.ini');
let botConfig = {};
let receiveWhitelist = [];
let senderWhitelist = [];
if (fs.existsSync(configPath)) {
    botConfig = ini.parse(fs.readFileSync(configPath, 'utf-8'));
    receiveWhitelist = botConfig.receive_whitelist ? botConfig.receive_whitelist.split(',').map(s => s.trim()) : [];
    senderWhitelist = botConfig.sender_whitelist ? botConfig.sender_whitelist.split(',').map(s => s.trim()) : [];
} else {
    console.warn("config.ini not found, proceeding with default settings.");
}

if (DEBUG) {
    console.log("=== DEBUG BOOT ===");
    console.log("Receive Whitelist:", receiveWhitelist);
    console.log("Sender Whitelist:", senderWhitelist);
}

// Load CSV Command Mapping
const csvPath = path.join(__dirname, 'cmd_mapping.csv');
let cmdMap = {};
if (fs.existsSync(csvPath)) {
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const commandsList = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });
    // Convert to a dictionary for O(1) lookups by cmdcode
    commandsList.forEach(cmd => {
        cmdMap[cmd.cmdcode.toLowerCase()] = cmd;
    });
    if (DEBUG) console.log("Cmd Map Loaded:", JSON.stringify(cmdMap, null, 2));
} else {
    console.warn("cmd_mapping.csv not found.");
}

// 2. Setup WhatsApp Client with LocalAuth
// We use LocalAuth so it saves the 'key' to your hard drive permanently.
const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: {
        headless: true, // Set to false if you want to see the browser window
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// 3. Authentication Events
client.on('qr', (qr) => {
    console.log('NEW DEVICE DETECTED: Scan this once to link permanently:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Connected! The session is saved. No more QR codes needed.');

    // Start Express API once client is ready
    const app = express();
    app.use(bodyParser.json());

    app.post('/send', async (req, res) => {
        try {
            const { sender_token, userphone, text, media_path } = req.body;

            if (senderWhitelist.length > 0 && !senderWhitelist.includes(sender_token)) {
                return res.status(403).json({ success: false, error: "Sender not in whitelist" });
            }
            if (receiveWhitelist.length > 0 && !receiveWhitelist.includes(userphone)) {
                return res.status(403).json({ success: false, error: "Receiver not in whitelist" });
            }

            const numberId = `${userphone}@c.us`;
            if (media_path) {
                const mediaToSend = MessageMedia.fromFilePath(media_path);
                await client.sendMessage(numberId, mediaToSend, { caption: text || '' });
            } else {
                await client.sendMessage(numberId, text || '');
            }

            logChatHistory(userphone, {
                timestamp: new Date().toISOString(),
                from: 'BOT_API',
                to: userphone,
                type: media_path ? 'media' : 'text',
                body: text || '',
                mediaSent: media_path || null
            });

            res.json({ success: true });
        } catch (error) {
            console.error('API Send Error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });

    const port = botConfig.api_port || 3000;
    app.listen(port, '127.0.0.1', () => {
        console.log(`Internal Push API listening on http://127.0.0.1:${port}`);
    });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

// Helper Function: Ensure User Session Directory Exists
function getUserSessionDir(userPhone) {
    const sessionDir = path.join(__dirname, 'chat_session', userPhone);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }
    return sessionDir;
}

// Helper Function: Log Message History
function logChatHistory(userPhone, logData) {
    const sessionDir = getUserSessionDir(userPhone);
    const logFile = path.join(sessionDir, 'chat_log.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
}

// 4. Message Execution Logic
client.on('message', async (msg) => {
    // Ignore status messages or messages from the bot itself
    if (msg.fromMe || msg.from === 'status@broadcast') return;

    // Extract user phone (remove @c.us or @g.us)
    const userPhone = msg.from.replace(/@c\.us|@g\.us/g, '');

    if (DEBUG) {
        console.log(`\n[DEBUG INCOMING RCV] from: ${userPhone}`);
        console.log(`Body: ${msg.body}`);
        console.log(`Has Media: ${msg.hasMedia}`);
    }

    // Whitelist check
    if (receiveWhitelist.length > 0 && !receiveWhitelist.includes(userPhone)) {
        msg.reply("You are not in the whitelist.");
        return;
    }

    const sessionDir = getUserSessionDir(userPhone);

    let downloadedMediaPath = "";

    // 4.1 Handle Media Downloads
    if (msg.hasMedia) {
        try {
            const media = await msg.downloadMedia();
            if (media && media.data) {
                // Ensure there is an extension based on mimetype
                let extension = media.mimetype.split('/')[1];
                if (extension && extension.includes(';')) {
                    extension = extension.split(';')[0];
                }
                const filename = `${msg.timestamp}_${msg.id.id}.${extension || 'bin'}`;
                downloadedMediaPath = path.join(sessionDir, filename);
                fs.writeFileSync(downloadedMediaPath, media.data, 'base64');
                console.log(`Media saved to: ${downloadedMediaPath}`);
            }
        } catch (err) {
            console.error('Failed to download media:', err);
        }
    }

    // 4.2 Log the incoming message
    const msgLog = {
        timestamp: new Date().toISOString(),
        id: msg.id.id,
        from: msg.from,
        userPhone: userPhone,
        body: msg.body,
        hasMedia: msg.hasMedia,
        localMediaPath: downloadedMediaPath || null
    };
    logChatHistory(userPhone, msgLog);

    // 4.3 Command Routing
    if (msg.body) {
        // First 2 chars = Command Code (e.g., "sh")
        const codeMatch = msg.body.trim().match(/^([a-zA-Z0-9]{2})(?:\s+(.*))?$/);

        if (codeMatch) {
            const code = codeMatch[1].toLowerCase();
            const params = codeMatch[2] ? codeMatch[2].trim() : "";

            if (cmdMap[code]) {
                const config = cmdMap[code];

                // Build the command: e.g., bash img.sh "userPhone" "code" "user input text" "/absolute/media/path.jpg"
                let fullShellCmd = `${config.base_cmd} ${config.script_name} "${userPhone}" "${code}" "${params}"`;
                if (downloadedMediaPath) {
                    fullShellCmd += ` "${downloadedMediaPath}"`;
                }

                if (DEBUG) console.log(`[DEBUG EXEC] Executing in ${config.work_dir}: ${fullShellCmd}`);

                // We pass the 'cwd' option so the subprocess starts in that folder
                exec(fullShellCmd, { cwd: config.work_dir }, async (error, stdout, stderr) => {
                    if (DEBUG) {
                        console.log(`[DEBUG] STDOUT:`, stdout);
                        console.log(`[DEBUG] STDERR:`, stderr);
                        if (error) console.log(`[DEBUG] ERROR:`, error);
                    }

                    if (error) {
                        console.error(`Execution Error: ${error}`);
                        if (stderr) console.error(`Stderr: ${stderr}`);
                    }

                    try {
                        // Extract JSON block using regex if there's leading/trailing text
                        let jsonStr = stdout;
                        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            jsonStr = jsonMatch[0];
                        }

                        // Attempt to parse and repair the CLI output as JSON
                        const repairedJson = jsonrepair(jsonStr);
                        const responseData = JSON.parse(repairedJson);

                        if (responseData.type === 'media') {
                            const mediaToSend = MessageMedia.fromFilePath(responseData.file_path);
                            await client.sendMessage(msg.from, mediaToSend, { caption: responseData.content || '' });

                            // Log the outgoing bot reply
                            logChatHistory(userPhone, {
                                timestamp: new Date().toISOString(),
                                from: 'BOT',
                                to: userPhone,
                                type: 'media',
                                body: responseData.content || '',
                                mediaSent: responseData.file_path
                            });
                        } else {
                            msg.reply(responseData.content || stdout);

                            logChatHistory(userPhone, {
                                timestamp: new Date().toISOString(),
                                from: 'BOT',
                                to: userPhone,
                                type: 'text',
                                body: responseData.content || stdout
                            });
                        }
                    } catch (e) {
                        // If it's not JSON, just treat it as a plain text reply
                        const replyText = stdout.trim() || "Command executed.";
                        msg.reply(replyText);

                        logChatHistory(userPhone, {
                            timestamp: new Date().toISOString(),
                            from: 'BOT',
                            to: userPhone,
                            type: 'text_raw',
                            body: replyText
                        });
                    }
                });
            }
        }
    }
});

client.initialize();

