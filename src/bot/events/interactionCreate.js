import { config } from '../../config/index.js';
import { buttonHandlers } from '../buttons/index.js';

export const name = 'interactionCreate';

/**
 * Handles incoming interactions (like buttons) and routes them to their registered actions.
 * @param {import('discord.js').Interaction} interaction - The Discord interaction object
 */
export async function execute(interaction) {
  if (!interaction.isButton()) return;

  // Authorization check: Only the configured owner can interact with these buttons
  if (interaction.user.id !== config.ownerId) {
    return interaction.reply({
      content: 'You are not authorized to view or manage these stats.',
      ephemeral: true
    });
  }

  const { customId } = interaction;
  const handler = buttonHandlers[customId];

  if (!handler) {
    console.warn(`Warning: No handler found for button customId: ${customId}`);
    return interaction.reply({
      content: 'This button action is not configured.',
      ephemeral: true
    });
  }

  try {
    await handler(interaction);
  } catch (error) {
    console.error(`Error executing handler for button ${customId}:`, error);

    const errorMessage = {
      content: 'An error occurred while processing this request.',
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}
