# Respawn Claim Bot

A Discord bot to manage respawn queues for Tibia players using Discord.js and Tibiadata.com. Players can register characters, claim caves, join queues, and receive automated notifications when it’s their turn — all through slash commands.

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
| `/respawn-admin-create <code> <name>`  | Creates a new cave                                            |
| `/respawn-admin-delete <code>`         | Deletes a cave by its code                                    |
| `/respawn-admin-edit <code>+2`         | Edits the name or code of a cave                              |

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
TIBIA_WORLD=YourTibiaWorld
```

### 2. Required Discord Bot Permissions
Make sure your bot has the following permissions in your server:

* Manage Messages
* Send Messages
* Read Message History
* Send Direct Messages
* Use Slash Commands

### 3. Install dependencies
```bash
npm install
```

### 4. Deploy slash commands
```bash
node deploy-commands.js
```

### 5. Start the bot
```bash
node index.js
```


### 🛠 Additional
```
There is a database file with default caves in data/respawns.json if you want to import it.
The database is in mongodb, an alternative is to use mongo atlas.
```


### 📸 Example Screenshots

* ![Image](https://github.com/user-attachments/assets/9c2d0bb2-8fc8-44b6-8d6c-0bd128085740)

* ![Image](https://github.com/user-attachments/assets/a0fe3c23-fa39-4628-8a64-0194ab11d479)

* ![Image](https://github.com/user-attachments/assets/df86a2ba-e268-414d-888e-270860209039)


### 📝 License

MIT © 2025 BrenoXFD
