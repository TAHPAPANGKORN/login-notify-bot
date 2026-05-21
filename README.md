# Discord Voice Channel Monitor Bot (with DM Dashboard)

A lightweight Node.js Discord bot using `discord.js` (v14+) and `mongoose` that monitors voice channels and sends interactive Direct Message (DM) alerts directly to the owner. It keeps track of daily voice channel session durations and features a clean, monospaced dashboard that can be refreshed or reset directly from the chat.

---

## Features

- **Voice Channel Join & Switch Detection**: Sends an alert when a user joins or switches voice channels.
- **Ignore Leave Events**: Does not spam your DMs when people leave a channel.
- **Owner Self-Notification Bypass**: Does not notify you when you join a channel yourself.
- **Interactive DM Dashboard**: Attached buttons in the DM alert allow you to view today's voice stats (calculated in real-time) or reset them.
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

- **Option A (GUI)**: Download [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and connect using `mongodb://localhost:27017`. Locate the `voice_monitor_dev` database and the `voice_session_stats` collection.
- **Option B (CLI)**: Run the Mongo Shell directly inside the Docker container:
  ```bash
  docker exec -it mongodb-local mongosh
  use voice_monitor_dev
  db.voice_session_stats.find()
  ```

---

## Production Deployment (Render)

1. Upload the code to your GitHub repository (excluding `node_modules` and `.env`).
2. Create a new **Web Service** on [Render](https://render.com/).
3. Set the following options:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node index.js`)
   - **Instance Type**: `Free`
4. Add the environment variables (`DISCORD_BOT_TOKEN`, `OWNER_ID`, `MONGODB_URI` pointing to MongoDB Atlas) in the **Environment** tab.
5. Create a free ping job on [cron-job.org](https://cron-job.org/) that pings the Render Web Service URL every 5 minutes to prevent the bot from sleeping.
