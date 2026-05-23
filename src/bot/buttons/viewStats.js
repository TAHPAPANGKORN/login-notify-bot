import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getStatsForToday } from '../../services/statService.js';
import { joinTimes } from '../client.js';
import { formatStatsTable } from '../../utils/format.js';

/**
 * Handles the 'view_stats_today' and 'refresh_stats_today' button interactions.
 * @param {import('discord.js').ButtonInteraction} interaction - The button interaction
 * @returns {Promise<void>}
 */
export async function handleViewStats(interaction) {
  // Defer the update to give us time to fetch and process stats
  await interaction.deferUpdate();

  // Fetch saved stats from the database
  const savedStats = await getStatsForToday();

  // Deep copy stats and merge with active users in voice channels (live view)
  const combinedStats = {};
  for (const [userId, userStat] of Object.entries(savedStats)) {
    combinedStats[userId] = {
      username: userStat.username,
      totalDurationMs: userStat.totalDurationMs,
      isOnline: false
    };
  }

  // Add active durations for users currently in voice channels
  const { client } = interaction;
  for (const [userId, joinTime] of joinTimes.entries()) {
    let username = 'Unknown User';
    // Resolve username from client cache across guilds
    for (const guild of client.guilds.cache.values()) {
      const member = guild.members.cache.get(userId) || guild.voiceStates.cache.get(userId)?.member;
      if (member) {
        username = member.user.username;
        break;
      }
    }
    const activeDuration = Date.now() - joinTime;

    if (!combinedStats[userId]) {
      combinedStats[userId] = {
        username: username,
        totalDurationMs: 0,
        isOnline: true
      };
    }

    combinedStats[userId].totalDurationMs += activeDuration;
    combinedStats[userId].isOnline = true;
  }

  const userEntries = Object.entries(combinedStats);

  // Build the dashboard embed
  const embed = new EmbedBuilder()
    .setColor('#5865F2') // Discord Blurple
    .setTitle(`Voice Session Dashboard - ${new Date().toLocaleDateString()}`)
    .setDescription(formatStatsTable(userEntries))
    .setTimestamp();

  // Refresh & Reset buttons row (without emojis)
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('refresh_stats_today')
      .setLabel('Refresh Stats')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('reset_stats_today')
      .setLabel('Reset Stats')
      .setStyle(ButtonStyle.Danger)
  );

  // Edit the message to show the updated dashboard
  await interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}
