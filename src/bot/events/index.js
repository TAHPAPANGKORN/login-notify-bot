import * as readyEvent from './ready.js';
import * as voiceStateUpdateEvent from './voiceStateUpdate.js';
import * as interactionCreateEvent from './interactionCreate.js';

/**
 * Attaches all event handlers to the given Discord client.
 * @param {import('discord.js').Client} client - The Discord client instance
 */
export function registerEvents(client) {
  const events = [
    readyEvent,
    voiceStateUpdateEvent,
    interactionCreateEvent
  ];

  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}
