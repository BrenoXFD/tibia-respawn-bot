import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import { resolveActiveCall, isCavePending } from '../../helpers/activeCalls.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_manage_clear')
    .setDescription('Removes the current player and the entire queue from a specific cave')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Cave code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');

    const respawn = await Respawn.findOne({ code });

    if (!respawn) {
      return interaction.reply({ content: `❌ No cave found with the code **${code}**.`, ephemeral: true });
    }

    const removedFromQueue = respawn.queue.length;
    let message = `🧹 The queue for cave **${respawn.name}** has been cleared (${removedFromQueue} players removed)`;

    if (respawn.current) {
      respawn.history.push({
        discordId: respawn.current.discordId,
        characters: respawn.current.characters,
        startTime: respawn.current.startTime,
        endTime: new Date()
      });
      respawn.current = null;
      message += ' and the current player was removed';
    }

    respawn.queue = [];
    await respawn.save();
    resolveActiveCall(code);

    return interaction.reply({ content: message + '.', ephemeral: false });
  }
};
