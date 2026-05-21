import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import http from 'http';
import { addDuration, getStatsForToday, resetStatsForToday } from './db.js';

// Load environment variables from .env file
dotenv.config();

const { DISCORD_BOT_TOKEN, OWNER_ID, MONGODB_URI } = process.env;

// Validate environment variables
if (!DISCORD_BOT_TOKEN || !OWNER_ID || !MONGODB_URI) {
  console.error('Error: Missing required environment variables in the .env file.');
  console.error('Please verify that DISCORD_BOT_TOKEN, OWNER_ID, and MONGODB_URI are defined.');
  process.exit(1);
}

// Start a basic HTTP server for Render's web service health checks & keep-alive pings
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Discord Bot is Online and Monitoring Voice Channels.');
}).listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});

// Initialize the Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// In-memory cache to track connection times (UserID -> Join Timestamp)
const joinTimes = new Map();

// Event listener: Client Ready
client.once('ready', () => {
  console.log(`Logged in and ready as ${client.user.tag}!`);
  console.log(`Monitoring voice channels. Alerts will be sent directly via DM to User ID: ${OWNER_ID}`);
});

// Event listener: Voice State Update (triggered when a user joins, leaves, or changes voice status)
client.on('voiceStateUpdate', async (oldState, newState) => {
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
    if (member.id === OWNER_ID) {
      console.log(`Owner (${member.user.username}) joined voice channel. Notification skipped.`);
      return;
    }

    const username = member.user.username;
    const voiceChannel = newState.channel;
    const voiceChannelName = voiceChannel ? voiceChannel.name : 'Unknown Voice Channel';

    try {
      // Fetch the owner user object
      const owner = client.users.cache.get(OWNER_ID) 
        || await client.users.fetch(OWNER_ID);

      if (!owner) {
        console.error(`Owner with ID ${OWNER_ID} was not found.`);
        return;
      }

      // Construct alert message (without emoji)
      const alertMessage = `**${username}** has joined the voice channel **${voiceChannelName}** in server **${newState.guild.name}**`;

      // Create interactive buttons for DM notification (without emojis)
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
      console.error(`Error sending DM to owner ${OWNER_ID}:`, error);
    }
  }
});

// Event listener: Interaction Create (triggered when the owner clicks on buttons)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  // Authorization check: Only the configured owner can interact with these buttons
  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: 'You are not authorized to view or manage these stats.',
      ephemeral: true
    });
  }

  const { customId } = interaction;

  if (customId === 'view_stats_today' || customId === 'refresh_stats_today') {
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
    for (const [userId, joinTime] of joinTimes.entries()) {
      let username = 'Unknown User';
      
      // Resolve username from client cache across guilds
      for (const guild of client.guilds.cache.values()) {
        const member = guild.members.cache.get(userId);
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

    // Build the dashboard embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2') // Discord Blurple
      .setTitle(`Voice Session Dashboard - ${new Date().toLocaleDateString()}`)
      .setTimestamp();

    const userEntries = Object.entries(combinedStats);

    if (userEntries.length === 0) {
      embed.setDescription("No voice channel activity has been recorded today yet.");
    } else {
      // Build a clean, monospaced text table for a professional dashboard look
      const lines = [];
      lines.push(`User             Duration       Status`);
      lines.push(`--------------------------------------`);

      userEntries.forEach(([userId, userStat]) => {
        const totalMinutes = Math.floor(userStat.totalDurationMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const seconds = Math.floor((userStat.totalDurationMs % (1000 * 60)) / 1000);

        let durationText = '';
        if (hours > 0) {
          durationText += `${hours}h `;
        }
        durationText += `${minutes}m ${seconds}s`;

        const name = userStat.username.substring(0, 15).padEnd(16);
        const dur = durationText.padEnd(14);
        const status = userStat.isOnline ? 'Active' : 'Offline';

        lines.push(`${name} ${dur} ${status}`);
      });

      embed.setDescription(`\`\`\`text\n${lines.join('\n')}\n\`\`\``);
    }

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

  if (customId === 'reset_stats_today') {
    await interaction.deferUpdate();

    // Reset stats in database
    await resetStatsForToday();

    // For any users currently in a voice channel, reset their in-memory session start to "now"
    for (const userId of joinTimes.keys()) {
      joinTimes.set(userId, Date.now());
    }

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
});

// Log in the bot using the token
client.login(DISCORD_BOT_TOKEN).catch((error) => {
  console.error('Failed to log in to Discord. Please check your DISCORD_BOT_TOKEN.');
  console.error(error);
});
