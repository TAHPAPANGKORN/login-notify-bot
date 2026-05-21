import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import http from 'http';

// Load environment variables from .env file
dotenv.config();

const { DISCORD_BOT_TOKEN, OWNER_ID } = process.env;

// Validate environment variables
if (!DISCORD_BOT_TOKEN || !OWNER_ID) {
  console.error('Error: Missing required environment variables in the .env file.');
  console.error('Please verify that DISCORD_BOT_TOKEN and OWNER_ID are defined.');
  process.exit(1);
}

// Start a basic HTTP server for Render's web service health checks & keep-alive pings
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Discord Bot is Online and Monitoring Voice Channels.');
}).listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

// Initialize the Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Event listener: Client Ready
client.once('ready', () => {
  console.log(`Logged in and ready as ${client.user.tag}!`);
  console.log(`Monitoring voice channels. Alerts will be sent directly via DM to User ID: ${OWNER_ID}`);
});

// Event listener: Voice State Update (triggered when a user joins, leaves, or changes voice status)
client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member;
  
  // Safety check: ensure member and user objects exist
  if (!member || !member.user) return;

  // Exclude bot accounts to avoid spam
  if (member.user.bot) return;

  const oldChannelId = oldState.channelId;
  const newChannelId = newState.channelId;

  // Determine if the user has joined a voice channel (or switched from another one)
  // - newChannelId must exist (not leaving)
  // - oldChannelId must be different from newChannelId (not just muting/deafening)
  const isJoinOrSwitch = newChannelId && (oldChannelId !== newChannelId);

  if (!isJoinOrSwitch) {
    return;
  }

  // Do NOT notify if the user who joined is the Owner (prevents self-notification)
  if (member.id === OWNER_ID) {
    console.log(`Owner (${member.user.username}) joined voice channel. Notification skipped.`);
    return;
  }

  const username = member.user.username;
  const voiceChannel = newState.channel;
  const voiceChannelName = voiceChannel ? voiceChannel.name : 'Unknown Voice Channel';

  try {
    // Fetch the owner user object
    const owner = client.users.cache.get(OWNER_ID) 
      || await client.users.fetch(OWNER_ID);

    if (!owner) {
      console.error(`Owner with ID ${OWNER_ID} was not found.`);
      return;
    }

    // Construct alert message for DM (no ping needed in DM as it notifies automatically)
    const alertMessage = `📢 **${username}** has joined the voice channel **${voiceChannelName}** in server **${newState.guild.name}**`;

    // Send the notification directly to the owner's DM
    await owner.send(alertMessage);
    console.log(`Sent DM alert to owner: ${username} joined "${voiceChannelName}".`);
  } catch (error) {
    console.error(`Error sending DM to owner ${OWNER_ID}:`, error);
  }
});

// Log in the bot using the token
client.login(DISCORD_BOT_TOKEN).catch((error) => {
  console.error('Failed to log in to Discord. Please check your DISCORD_BOT_TOKEN.');
  console.error(error);
});
