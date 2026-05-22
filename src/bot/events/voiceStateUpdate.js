import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../../config/index.js';
import { joinTimes } from '../client.js';
import { addDuration } from '../../services/statService.js';

export const name = 'voiceStateUpdate';

/**
 * Handles tracking user session durations and notifying the owner of join/switch events.
 * @param {import('discord.js').VoiceState} oldState - The old voice channel state
 * @param {import('discord.js').VoiceState} newState - The new voice channel state
 */
export async function execute(oldState, newState) {
  const member = newState.member;
  
  // Safety check: ensure member and user objects exist
  if (!member || !member.user) return;

  // Exclude bot accounts to avoid spam
  if (member.user.bot) return;

  const oldChannelId = oldState.channelId;
  const newChannelId = newState.channelId;

  // Determine if the user joined, left, or switched channels
  const isJoinOrSwitch = newChannelId && (oldChannelId !== newChannelId);

  // Track session duration when they disconnect or switch away from their current channel
  if (oldChannelId && (oldChannelId !== newChannelId)) {
    const joinTime = joinTimes.get(member.id);
    if (joinTime) {
      const durationMs = Date.now() - joinTime;
      joinTimes.delete(member.id);
      await addDuration(member.id, member.user.username, durationMs);
      console.log(`Tracked: ${member.user.username} spent ${Math.round(durationMs / 1000)}s in voice.`);
    }
  }

  // Cache join time when they connect to a channel
  if (newChannelId && (oldChannelId !== newChannelId)) {
    joinTimes.set(member.id, Date.now());
  }

  // Do NOT notify if the user who joined is the Owner (prevents self-notification)
  if (isJoinOrSwitch) {
    if (member.id === config.ownerId) {
      console.log(`Owner (${member.displayName}) joined voice channel. Notification skipped.`);
      return;
    }

    const username = member.displayName;
    const voiceChannel = newState.channel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : 'Unknown Voice Channel';

    try {
      const { client } = newState;
      // Fetch the owner user object
      const owner = client.users.cache.get(config.ownerId) 
        || await client.users.fetch(config.ownerId);

      if (!owner) {
        console.error(`Owner with ID ${config.ownerId} was not found.`);
        return;
      }

      let alertMessage;
      if (!oldChannelId) {
        alertMessage = `${username} join ${voiceChannelName}`;
      } else {
        const oldChannel = oldState.channel;
        const oldChannelName = oldChannel ? oldChannel.name : 'Unknown Voice Channel';
        alertMessage = `${username} moved from ${oldChannelName} to ${voiceChannelName}`;
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('view_stats_today')
          .setLabel("View Today's Stats")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('reset_stats_today')
          .setLabel('Reset Stats')
          .setStyle(ButtonStyle.Danger)
      );

      // Send the DM notification
      await owner.send({
        content: alertMessage,
        components: [row]
      });
      console.log(`Sent DM alert to owner: ${username} joined "${voiceChannelName}".`);
    } catch (error) {
      console.error(`Error sending DM to owner ${config.ownerId}:`, error);
    }
  }
}
