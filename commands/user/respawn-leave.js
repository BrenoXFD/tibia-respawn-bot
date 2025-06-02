import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import { resolveActiveCall } from '../../helpers/activeCalls.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_leave')
    .setDescription('Leave the occupied cave and free it for the next in queue')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Cave code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');
    const discordId = interaction.user.id;

    const respawn = await Respawn.findOne({ code });
    if (!respawn) {
      return interaction.reply({
        content: `❌ No cave found with code **${code}**.`,
        ephemeral: true
      });
    }

    if (!respawn.current || respawn.current.discordId !== discordId) {
      return interaction.reply({
        content: `❌ You are not the current occupant of the cave **${respawn.name}**.`,
        ephemeral: true
      });
    }

    respawn.history.push({
      discordId,
      characters: respawn.current.characters,
      startTime: respawn.current.startTime,
      endTime: new Date()
    });

    respawn.current = null;
    respawn.markModified('current');

    await respawn.save();
    await resolveActiveCall(code, interaction.client);

    return interaction.reply({
      content: `✅ You have left the cave **${respawn.name}**.`,
      ephemeral: false
    });
  }
};
