import { config } from './config/index.js';
import { connectDatabase } from './database/index.js';
import { startServer } from './server.js';
import { client } from './bot/client.js';
import { registerEvents } from './bot/events/index.js';

/**
 * Bootstraps the application services and connects to external APIs.
 */
async function bootstrap() {
  try {
    console.log('Bootstrapping Discord Bot Application...');

    // 1. Start HTTP keep-alive server for Render/Uptime pinging
    startServer();

    // 2. Connect to database
    await connectDatabase();

    // 3. Register events on the bot client
    registerEvents(client);

    // 4. Log in to Discord Gateway
    await client.login(config.discordToken);
  } catch (error) {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
  }
}

bootstrap();
