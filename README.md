# Discord Voice Channel Monitor Bot (with DM Dashboard)

A lightweight Node.js Discord bot using `discord.js` (v14+) and `mongoose` that monitors voice channels and sends interactive Direct Message (DM) alerts directly to the owner. It keeps track of daily voice channel session durations and features a clean, monospaced dashboard that can be refreshed or reset directly from the chat.

---

## Features

- **Voice Channel Join & Switch Detection**: Sends an alert when a user joins or switches voice channels.
- **Ignore Leave Events**: Does not spam your DMs when people leave a channel.
- **Owner Self-Notification Bypass**: Does not notify you when you join a channel yourself.
- **Interactive DM Dashboard**: Attached buttons in the DM alert allow you to view today's voice stats (calculated in real-time) or reset them.
- **Persistent Active Tracking**: Saves active voice sessions to the database, ensuring seamless time tracking and accurate dashboard stats even if the bot process restarts.
- **Timezone Locked to GMT+7**: Daily statistics and dashboard titles are locked to the `Asia/Bangkok` timezone to prevent date mismatches across servers.
- **Production-Ready Database**: Saves connection history to MongoDB (supports Docker for local development and MongoDB Atlas for production).

---

## Installation & Setup

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.11.0 or higher is required for `discord.js` v14+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local MongoDB database)

### 2. Install Dependencies
Navigate to the project folder and run:
```bash
npm install
```

### 3. Run Local Database (Docker)
Start a local MongoDB container in the background:
```bash
docker run -d --name mongodb-local -p 27017:27017 mongo:latest
```
*Note: Make sure your Docker Desktop app is running before executing the command.*

### 4. Environment Configuration
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your details:
- `DISCORD_BOT_TOKEN`: Your private Discord bot token.
- `OWNER_ID`: Your personal Discord User ID.
- `MONGODB_URI`: The connection URI for MongoDB. 
  - **For Development (Local Docker)**: Use `mongodb://127.0.0.1:27017/voice_monitor_dev`
  - **For Production**: Use your MongoDB Atlas connection string (e.g. `mongodb+srv://...`)

---

## How to Run Locally

Start the bot in development mode:
```bash
npm start
```
Upon a successful connection, you should see:
```text
Web server listening on port 3000
Successfully connected to production database (MongoDB Atlas).  # Or local MongoDB
Logged in and ready as BotName#1234!
Monitoring voice channels. Alerts will be sent directly via DM to User ID: XXXXXXXXX
```

---

## Accessing the Local Database
To view the recorded voice session collections locally:

- **Option A (GUI)**: Download [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and connect using `mongodb://localhost:27017`. Locate the `voice_monitor_dev` database. You will see two collections:
  - `voice_session_stats`: Today's accumulated duration stats.
  - `active_sessions`: Temporary sessions tracking active users currently in voice channels.
