import dotenv from 'dotenv';

// Load environment variables from the appropriate .env file
dotenv.config();

const { DISCORD_BOT_TOKEN, OWNER_ID, MONGODB_URI, PORT } = process.env;

// Validate that required environment variables are present
const requiredEnv = { DISCORD_BOT_TOKEN, OWNER_ID, MONGODB_URI };
const missing = Object.entries(requiredEnv)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error('Error: Missing required environment variables in the .env file.');
  console.error(`Please verify that the following are defined: ${missing.join(', ')}`);
  process.exit(1);
}

export const config = {
  discordToken: DISCORD_BOT_TOKEN,
  ownerId: OWNER_ID,
  mongodbUri: MONGODB_URI,
  port: parseInt(PORT || '3000', 10),
};
