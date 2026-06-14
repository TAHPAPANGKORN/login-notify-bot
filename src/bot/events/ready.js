import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config } from '../../config/index.js';
import { joinTimes } from '../client.js';
import { getActiveSessions, saveActiveSession, deleteActiveSession } from '../../services/statService.js';

export const name = 'ready';
export const once = true;

/**
 * Executes the "ready" event logic when the client logs in.
 * @param {import('discord.js').Client} client - The Discord client
 */
export async function execute(client) {
  console.log(`Logged in and ready as ${client.user.tag}!`);

  // Register Slash Commands dynamically
  try {
    console.log('Started refreshing application (/) commands globally...');
    const rest = new REST({ version: '10' }).setToken(config.discordToken);

    const commands = [
      new SlashCommandBuilder()
        .setName('ignore-room')
        .setDescription('Ignore login notifications for a specific voice channel')
        .addStringOption(option =>
          option.setName('room')
            .setDescription('The name of the voice channel to ignore')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('unignore-room')
        .setDescription('Stop ignoring login notifications for a specific voice channel')
        .addStringOption(option =>
          option.setName('room')
            .setDescription('The name of the voice channel to unignore')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('list-ignored-rooms')
        .setDescription('List all ignored voice channels'),
      new SlashCommandBuilder()
        .setName('ignore-user')
        .setDescription('Ignore login notifications for a specific user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Select the user to ignore')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Type a username or display name to ignore')
            .setRequired(false)
        ),
      new SlashCommandBuilder()
        .setName('unignore-user')
        .setDescription('Stop ignoring login notifications for a specific user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Select the user to unignore')
            .setRequired(false)
        )
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Type a username or display name to unignore')
            .setRequired(false)
        ),
      new SlashCommandBuilder()
        .setName('list-ignored-users')
        .setDescription('List all ignored users')
    ].map(command => command.toJSON());

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error during application (/) commands registration:', error);
  }

  try {
    // 1. Scan all voice channels to find currently active users (excluding bots)
    const activeVoiceUsers = new Map(); // userId -> { username }
    
    for (const guild of client.guilds.cache.values()) {
      for (const voiceState of guild.voiceStates.cache.values()) {
        const member = voiceState.member;
        if (voiceState.channelId && member && !member.user.bot) {
          activeVoiceUsers.set(member.id, {
            username: member.user.username
          });
        }
      }
    }

    // 2. Fetch all active sessions stored in the database
    const dbSessions = await getActiveSessions();
    const dbSessionsMap = new Map(dbSessions.map(s => [s.userId, s]));

    console.log(`Found ${activeVoiceUsers.size} users currently in voice channels and ${dbSessions.length} active sessions in DB.`);

    // 3. Sync: Add missing active sessions to DB, load existing ones into memory
    for (const [userId, userInfo] of activeVoiceUsers.entries()) {
      const dbSession = dbSessionsMap.get(userId);
      if (dbSession) {
        // Load original join time from DB into memory cache
        const joinTimeMs = new Date(dbSession.joinTime).getTime();
        joinTimes.set(userId, joinTimeMs);
        console.log(`Synced active user ${userInfo.username} (${userId}) with joinTime: ${dbSession.joinTime}`);
      } else {
        // User joined while bot was offline. Create new session starting now.
        const nowMs = Date.now();
        joinTimes.set(userId, nowMs);
        await saveActiveSession(userId, userInfo.username, nowMs);
        console.log(`Created new active session for user ${userInfo.username} (${userId}) who joined while bot was offline.`);
      }
    }

    // 4. Cleanup: Delete active sessions from DB if the user is no longer in a voice channel
    for (const dbSession of dbSessions) {
      if (!activeVoiceUsers.has(dbSession.userId)) {
        await deleteActiveSession(dbSession.userId);
        console.log(`Cleaned up stale active session for user ${dbSession.username} (${dbSession.userId}) who left while bot was offline.`);
      }
    }

  } catch (error) {
    console.error('Error during startup voice session synchronization:', error);
  }

  console.log(`Monitoring voice channels. Alerts will be sent directly via DM to User ID: ${config.ownerId}`);
}

