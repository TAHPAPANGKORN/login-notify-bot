import { config } from '../../config/index.js';

export const name = 'ready';
export const once = true;

/**
 * Executes the "ready" event logic when the client logs in.
 * @param {import('discord.js').Client} client - The Discord client
 */
export function execute(client) {
  console.log(`Logged in and ready as ${client.user.tag}!`);
  console.log(`Monitoring voice channels. Alerts will be sent directly via DM to User ID: ${config.ownerId}`);
}
