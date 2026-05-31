import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../../config/index.js';
import { joinTimes } from '../client.js';
import { addDuration, saveActiveSession, deleteActiveSession } from '../../services/statService.js';
import { isRoomIgnored } from '../../services/ignoredRoomService.js';


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
      await deleteActiveSession(member.id);
      console.log(`Tracked: ${member.user.username} spent ${Math.round(durationMs / 1000)}s in voice.`);
    }
  }

  // Cache join time when they connect to a channel
  if (newChannelId && (oldChannelId !== newChannelId)) {
    const now = Date.now();
    joinTimes.set(member.id, now);
    await saveActiveSession(member.id, member.user.username, now);
  }

  // Do NOT notify if the user is the Owner (prevents self-notification)
  if (member.id !== config.ownerId) {
    const username = member.displayName;
    const voiceChannel = newState.channel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : 'Unknown Voice Channel';

    const notifyOwner = async (client, alertMessage) => {
      try {
        const owner = client.users.cache.get(config.ownerId) 
          || await client.users.fetch(config.ownerId);

        if (!owner) {
          console.error(`Owner with ID ${config.ownerId} was not found.`);
          return;
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
        console.log(`Sent DM alert to owner: "${alertMessage}"`);
      } catch (error) {
        console.error(`Error sending DM to owner ${config.ownerId}:`, error);
      }
    };

    // 1. Handle join or switch notification
    if (isJoinOrSwitch) {
      let alertMessage;
      if (!oldChannelId) {
        // If the room they joined is ignored, skip notification
        if (await isRoomIgnored(voiceChannelName)) {
          console.log(`Skipping notification for ${username} joining ignored room ${voiceChannelName}`);
          return;
        }
        alertMessage = `${username} join ${voiceChannelName}`;
      } else {
        const oldChannel = oldState.channel;
        const oldChannelName = oldChannel ? oldChannel.name : 'Unknown Voice Channel';
        
        // If moving to an ignored room, skip notification entirely
        if (await isRoomIgnored(voiceChannelName)) {
          console.log(`Skipping notification for ${username} moving to ignored room ${voiceChannelName}`);
          return;
        }

        // If moving from an ignored room to a non-ignored room, treat it as a join to avoid leaking the ignored room name
        if (await isRoomIgnored(oldChannelName)) {
          alertMessage = `${username} join ${voiceChannelName}`;
        } else {
          alertMessage = `${username} moved from ${oldChannelName} to ${voiceChannelName}`;
        }
      }
      await notifyOwner(newState.client, alertMessage);
    }

    // 2. Handle screen share (streaming) started notification
    const screenShareStarted = !oldState.streaming && newState.streaming;
    if (screenShareStarted && !(await isRoomIgnored(voiceChannelName))) {
      const alertMessage = `${username} started sharing screen in ${voiceChannelName}`;
      await notifyOwner(newState.client, alertMessage);
    }

    // 3. Handle camera (video) opened notification
    const cameraStarted = !oldState.selfVideo && newState.selfVideo;
    if (cameraStarted && !(await isRoomIgnored(voiceChannelName))) {
      const alertMessage = `${username} turned on camera in ${voiceChannelName}`;
      await notifyOwner(newState.client, alertMessage);
    }
  } else {
    if (isJoinOrSwitch) {
      console.log(`Owner (${member.displayName}) joined voice channel. Notification skipped.`);
    }
  }
}

