import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('whois_char')
    .setDescription('Find out who owns a character')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Character name')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const inputName = interaction.options.getString('name');
    const inputLower = inputName.toLowerCase();

    const allUsers = await User.find();

    const owner = allUsers.find(u =>
      u.characters.some(c => c.toLowerCase() === inputLower)
    );

    if (!owner) {
      return interaction.editReply({
        content: `❌ The character **${inputName}** is not registered to any user.`
      });
    }

    const originalName = owner.characters.find(c => c.toLowerCase() === inputLower);
    const profileLink = `https://www.tibia.com/community/?name=${encodeURIComponent(originalName)}`;

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Whois: ${originalName}`)
      .setDescription(`This character is registered to <@${owner.discordId}>.`)
      .setColor(0xe3d510)
      .setURL(profileLink)
      .setFooter({ text: 'Character lookup' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
