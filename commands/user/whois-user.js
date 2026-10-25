import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('whois_user')
    .setDescription('Displays the characters registered by a user and their online status')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Discord user')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const dbUser = await User.findOne({ discordId: targetUser.id });

    if (!dbUser || dbUser.characters.length === 0) {
      return interaction.editReply({
        content: `❌ The user <@${targetUser.id}> has no registered characters.`
      });
    }

    let onlineNames = [];
    const world = process.env.TIBIA_WORLD;
    try {
      const { data } = await axios.get(`https://api.tibiadata.com/v5/world/${world}`);
      const onlinePlayers = data.world.online_players;
      if (Array.isArray(onlinePlayers)) {
        onlineNames = onlinePlayers.map(p => p.name.toLowerCase());
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        console.error(`❌ TibiaData world not found: ${world}`);
        return interaction.editReply({
          content: '❌ The configured Tibia world could not be found. Please contact an administrator.'
        });
      }

      console.error('❌ TibiaData API error:', err);
      return interaction.editReply({
        content: '❌ Failed to check online characters. Please try again later.'
      });
    }

    const list = dbUser.characters.map(name => {
      const isOnline = onlineNames.includes(name.toLowerCase());
      const status = isOnline ? '🟢' : '🔴';
      const link = `https://www.tibia.com/community/?name=${encodeURIComponent(name)}`;
      return `${status} [**${name}**](${link})`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`${targetUser.username}'s Characters`)
      .setDescription(list.join('\n\n'))
      .setColor(0xe3d510)
      .setFooter({ text: `Total: ${dbUser.characters.length} character(s)` })
      .setTimestamp()
      .setThumbnail(targetUser.displayAvatarURL());

    return interaction.editReply({ embeds: [embed] });
  }
};
