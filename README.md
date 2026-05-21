# Discord Voice Channel Monitor Bot

A lightweight Node.js Discord bot using `discord.js` (v14+) that monitors voice channels and sends a text notification tagging the server owner when someone joins.

---

## Features

- **Voice Channel Join & Switch Detection**: Triggers alerts when a user joins a voice channel or switches between voice channels.
- **Leave Events Ignored**: Does not spam you when people leave a channel.
- **Self-Notification Prevention**: Does not trigger alerts when the configured Owner joins a voice channel.
- **Bot Filter**: Automatically filters out bot accounts to prevent loop notifications.
- **Direct Owner Ping**: Sends an alert tagged with the owner's ID, triggering a mobile/desktop push notification.

---

## Installation & Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v16.11.0 or higher is required for `discord.js` v14+).

### 2. Install Dependencies
Clone or download this project, navigate to the folder, and install the required modules:
```bash
npm install
```

### 3. Environment Configuration
Copy the `.env.example` file to a new file named `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your details:
- `DISCORD_BOT_TOKEN`: The private token of your Discord bot.
- `ALERT_CHANNEL_ID`: The ID of the text channel where notification messages will be sent.
- `OWNER_ID`: Your personal Discord User ID to ensure you receive the push notification.

---

## Discord Developer Portal Configuration Checklist

To make the bot function, you must set it up correctly in the [Discord Developer Portal](https://discord.com/developers/applications):

### 1. Enable Required Bot Intents
When configuring your bot in the Discord Developer Portal, navigate to the **Bot** tab on the left menu, scroll down to the **Privileged Gateway Intents** section, and note the following:

- **Presence Intent**: ❌ **Not Required**. (Used for user status/activities).
- **Server Members Intent**: ❌ **Not Required**. (Voice update payloads include member data automatically).
- **Message Content Intent**: ❌ **Not Required**. (Your bot only *sends* messages and does not read messages sent by other users).

> [!TIP]
> Because this bot uses only standard intents (`Guilds` and `GuildVoiceStates`), you **do not** need to toggle on any Privileged Gateway Intents for this bot to work! This keeps the bot secure and means it does not require special approval from Discord.

### 2. Generate Invite Link & Permissions
To add the bot to your server, go to the **OAuth2** tab, click **URL Generator**, and configure as follows:
- **Scopes**: Select `bot`.
- **Bot Permissions**: Select the following permissions:
  - `Read Messages/View Channels` (under General Permissions)
  - `Send Messages` (under Text Permissions)
  - `Embed Links` (under Text Permissions)
  - `Read Message History` (under Text Permissions)
- Copy the generated URL at the bottom and open it in your browser to invite the bot to your guild.

---

## How to Run

To start the bot in development mode:
```bash
node index.js
```

Or you can add a start script in `package.json` to run it:
```bash
npm start
```
*(To do this, add `"start": "node index.js"` under the `"scripts"` object in your `package.json`.)*
# checkInNotiDiscordBot
