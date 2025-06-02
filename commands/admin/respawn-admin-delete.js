import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import { generateCaveImage } from '../../utils/generateCaveImage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_admin_delete')
    .setDescription('Deletes an existing cave')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Cave code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');

    const respawn = await Respawn.findOne({ code });
    if (!respawn) {
      return interaction.reply({
        content: `❌ No cave found with code **${code}**.`,
        ephemeral: true
      });
    }

    await Respawn.deleteOne({ code });
    await generateCaveImage();

    return interaction.reply({
      content: `🗑️ Cave with code **${code}** was successfully deleted.`,
      ephemeral: false
    });
  }
};
