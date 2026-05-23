import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { resetStatsForToday, resetActiveSessions } from '../../services/statService.js';
import { joinTimes } from '../client.js';

/**
 * Handles the 'reset_stats_today' button interaction.
 * @param {import('discord.js').ButtonInteraction} interaction - The button interaction
 * @returns {Promise<void>}
 */
export async function handleResetStats(interaction) {
  await interaction.deferUpdate();

  // Reset stats in database
  await resetStatsForToday();

  // For any users currently in a voice channel, reset their in-memory session start to "now"
  const activeUserIds = Array.from(joinTimes.keys());
  const now = Date.now();
  for (const userId of activeUserIds) {
    joinTimes.set(userId, now);
  }
  await resetActiveSessions(activeUserIds);

  const embed = new EmbedBuilder()
    .setColor('#ED4245') // Red
    .setTitle('Dashboard Reset')
    .setDescription("Today's stats have been reset successfully. Live active users' timers are restarted from zero.")
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('refresh_stats_today')
      .setLabel('Refresh Stats')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({
    embeds: [embed],
    components: [row]
  });
}
