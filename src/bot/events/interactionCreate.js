import { config } from '../../config/index.js';
import { buttonHandlers } from '../buttons/index.js';
import { ignoreRoom, unignoreRoom, getIgnoredRooms } from '../../services/ignoredRoomService.js';
import { ignoreUser, unignoreUser, getIgnoredUsers } from '../../services/ignoredUserService.js';

export const name = 'interactionCreate';

/**
 * Handles slash command interactions.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function handleChatInputCommand(interaction) {
  const { commandName } = interaction;

  try {
    if (commandName === 'ignore-room') {
      const room = interaction.options.getString('room');
      const success = await ignoreRoom(room);
      if (success) {
        return interaction.reply({
          content: `Room **${room}** is now ignored.`,
          ephemeral: true
        });
      } else {
        return interaction.reply({
          content: 'Failed to ignore room due to a database error.',
          ephemeral: true
        });
      }
    }

    if (commandName === 'unignore-room') {
      const room = interaction.options.getString('room');
      const removed = await unignoreRoom(room);
      if (removed) {
        return interaction.reply({
          content: `Room **${room}** has been removed from the ignored list.`,
          ephemeral: true
        });
      } else {
        return interaction.reply({
          content: `Room **${room}** was not found in the ignored list.`,
          ephemeral: true
        });
      }
    }

    if (commandName === 'list-ignored-rooms') {
      const rooms = await getIgnoredRooms();
      if (rooms.length === 0) {
        return interaction.reply({
          content: 'No rooms are currently ignored.',
          ephemeral: true
        });
      }
      return interaction.reply({
        content: `**Ignored Rooms:**\n${rooms.map(r => `- ${r}`).join('\n')}`,
        ephemeral: true
      });
    }

    if (commandName === 'ignore-user') {
      const userOption = interaction.options.getUser('user');
      const usernameOption = interaction.options.getString('username');

      if (!userOption && !usernameOption) {
        return interaction.reply({
          content: 'Please specify a user to ignore, either by selecting them or typing their username.',
          ephemeral: true
        });
      }

      const success = await ignoreUser({
        userId: userOption ? userOption.id : null,
        username: userOption ? userOption.username : usernameOption
      });

      const targetName = userOption ? userOption.username : usernameOption;
      if (success) {
        return interaction.reply({
          content: `User **${targetName}** is now ignored.`,
          ephemeral: true
        });
      } else {
        return interaction.reply({
          content: 'Failed to ignore user due to an error.',
          ephemeral: true
        });
      }
    }

    if (commandName === 'unignore-user') {
      const userOption = interaction.options.getUser('user');
      const usernameOption = interaction.options.getString('username');

      if (!userOption && !usernameOption) {
        return interaction.reply({
          content: 'Please specify a user to unignore, either by selecting them or typing their username.',
          ephemeral: true
        });
      }

      const removed = await unignoreUser({
        userId: userOption ? userOption.id : null,
        username: userOption ? userOption.username : usernameOption
      });

      const targetName = userOption ? userOption.username : usernameOption;
      if (removed) {
        return interaction.reply({
          content: `User **${targetName}** has been removed from the ignored list.`,
          ephemeral: true
        });
      } else {
        return interaction.reply({
          content: `User **${targetName}** was not found in the ignored list.`,
          ephemeral: true
        });
      }
    }

    if (commandName === 'list-ignored-users') {
      const users = await getIgnoredUsers();
      if (users.length === 0) {
        return interaction.reply({
          content: 'No users are currently ignored.',
          ephemeral: true
        });
      }
      return interaction.reply({
        content: `**Ignored Users:**\n${users.map(u => `- ${u}`).join('\n')}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error(`Error handling slash command ${commandName}:`, error);
    return interaction.reply({
      content: 'An error occurred while processing this command.',
      ephemeral: true
    });
  }
}

/**
 * Handles incoming interactions (like buttons and slash commands) and routes them.
 * @param {import('discord.js').Interaction} interaction - The Discord interaction object
 */
export async function execute(interaction) {
  // Authorization check: Only the configured owner can interact with the bot
  if (interaction.user.id !== config.ownerId) {
    return interaction.reply({
      content: 'You are not authorized to view or manage these stats.',
      ephemeral: true
    });
  }

  // Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    return handleChatInputCommand(interaction);
  }

  // Handle Button Interactions
  if (interaction.isButton()) {
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
}

