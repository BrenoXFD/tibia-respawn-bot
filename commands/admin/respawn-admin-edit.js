import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import { generateCaveImage } from '../../utils/generateCaveImage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_admin_edit')
    .setDescription('Edits an existing cave')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Current cave code')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('new_code')
        .setDescription('New code (optional)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('new_name')
        .setDescription('New name (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');
    const newCode = interaction.options.getString('new_code');
    const newName = interaction.options.getString('new_name');

    const respawn = await Respawn.findOne({ code });
    if (!respawn) {
      return interaction.reply({
        content: `❌ No cave found with code **${code}**.`,
        ephemeral: true
      });
    }

    if (!newCode && !newName) {
      return interaction.reply({
        content: '⚠️ You must provide at least one field to update.',
        ephemeral: true
      });
    }

    if (newCode) {
      const existingCode = await Respawn.findOne({ code: newCode });
      if (existingCode && existingCode.code !== code) {
        return interaction.reply({
          content: `❌ A cave with code **${newCode}** already exists.`,
          ephemeral: true
        });
      }
      respawn.code = newCode;
    }

    if (newName) {
      respawn.name = newName;
    }

    await respawn.save();
    await generateCaveImage();

    return interaction.reply({
      content: `✅ Cave successfully updated.`,
      ephemeral: false
    });
  }
};
