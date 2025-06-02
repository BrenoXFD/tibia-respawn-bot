import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import { generateCaveImage } from '../../utils/generateCaveImage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_admin_create')
    .setDescription('Creates a new cave for management')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Cave code')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Cave name')
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');
    const name = interaction.options.getString('name');

    const existing = await Respawn.findOne({ code });
    if (existing) {
      return interaction.reply({
        content: `❌ A cave with the code **${code}** already exists.`,
        ephemeral: true
      });
    }

    const newCave = new Respawn({ code, name });
    await newCave.save();

    await generateCaveImage();

    return interaction.reply({
      content: `✅ Cave **${name}** successfully created with code **${code}**.`,
      ephemeral: false
    });
  }
};
