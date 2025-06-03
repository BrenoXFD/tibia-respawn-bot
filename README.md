# Respawn Claim Bot

A Discord bot to manage respawn queues for Tibia players. Players can register characters, claim caves, join queues, and receive automated notifications when it’s their turn — all through slash commands.

---

## 📦 Features

✅ Character registration and ownership validation  
📩 DM notifications with "Accept" button when it's your turn  
⏱️ 3h15 timers, queue and turn enforcement  
🛠️ Admin tools to manage users, queues and blocks  
🖼️ Real-time image with the full cave list, auto-updated  

---

## 💬 Available Commands

### 👤 User Commands

| Command                     | Description                                                   |
|----------------------------|---------------------------------------------------------------|
| `/im <name>`               | Register a Tibia character                                     |
| `/imnot <name>`            | Remove a registered character                                 |
| `/respawn claim <code>`    | Claim a cave (or enter its queue if occupied)                 |
| `/respawn next <code>`     | Join as the next in line for a cave                           |
| `/respawn info <code>`     | View the current and next players for a cave                  |
| `/respawn history <code>`  | View who used a cave in the last 24h                          |
| `/respawn leave <code>`    | Leave the cave you're currently occupying                     |
| `/whois char <name>`       | See which Discord user owns the registered character          |
| `/whois_user @user`        | Show the user’s characters and their online status            |

---

### 🛡️ Admin Commands

| Command                                | Description                                                   |
|----------------------------------------|---------------------------------------------------------------|
| `/respawn-manage clear <code>`         | Clear the queue of a specific cave                            |
| `/respawn-manage clear-all`            | Clear all cave queues                                         |
| `/respawn-manage kick @user`           | Kick a user from the queue and call the next one              |
| `/respawn-manage bump-user @user <code>` | Force a user to become the current in a cave                |
| `/respawn-block @user <duration>`      | Temporarily block a user from using the bot                  |

---

## ⚙️ Configuration Guide

### 1. Environment Variables

Create a `.env` file from the `.env.example` template:

```env
TOKEN=your-discord-bot-token
CLIENT_ID=your-client-id
GUILD_ID=your-guild-id
MONGODB_URI=your-mongodb-uri
STATUS_CHANNEL_ID=channel-id-to-post-cave-status
ROLE_USER=Claim Bot
ROLE_ADMIN=Bot Admin
TIBIA_WORLD=Yovera```


2. Required Discord Bot Permissions
Make sure your bot has the following permissions in your server:

Manage Messages

Send Messages

Read Message History

Send Direct Messages

Use Slash Commands

3. Install dependencies
bash
Copiar
Editar
npm install
4. Deploy slash commands
bash
Copiar
Editar
node deploy-commands.js
5. Start the bot
bash
Copiar
Editar
node index.js
🛠 Additional Tools
Script	Purpose
scripts/exportRespawns.js	Export caves from your DB to JSON
scripts/importRespawns.js	Import caves from JSON to your DB
jobs/syncRespawnStatus.js	Auto-update message with active caves

📸 Example Screenshots (coming soon)
Queue status message in Discord

DM notification with Accept button

Auto-generated cave list image

📝 License
MIT © 2025 BrenoXFD
