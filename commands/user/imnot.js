import { SlashCommandBuilder } from 'discord.js';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('imnot')
    .setDescription('Remove a character from your profile')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the character to remove')
        .setRequired(true)
    ),

  async execute(interaction) {
    const inputNick = interaction.options.getString('name');
    const inputLower = inputNick.toLowerCase();
    const discordId = interaction.user.id;

    const user = await User.findOne({ discordId });
    if (!user || !user.characters || user.characters.length === 0) {
      return interaction.reply({
        content: `❌ You don't have any registered characters.`,
        ephemeral: true
      });
    }

    const originalName = user.characters.find(c => c.toLowerCase() === inputLower);

    if (!originalName) {
      return interaction.reply({
        content: `❌ The character **${inputNick}** is not registered in your profile.`,
        ephemeral: true
      });
    }

    user.characters = user.characters.filter(c => c.toLowerCase() !== inputLower);
    await user.save();

    return interaction.reply({
      content: `✅ The character **${originalName}** was successfully removed from your profile.`,
      ephemeral: false
    });
  }
};
