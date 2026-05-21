import { Client, GatewayIntentBits } from 'discord.js';

// Initialize the Discord client with required gateway intents
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// In-memory cache to track connection times (UserID -> Join Timestamp)
export const joinTimes = new Map();
