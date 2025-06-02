import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import { resolveActiveCall } from '../../helpers/activeCalls.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_manage_clear_all')
    .setDescription('Removes the current player and queue from all caves'),

  async execute(interaction) {
    await interaction.deferReply();

    const respawns = await Respawn.find();
    let removedFromQueue = 0;
    let removedCurrent = 0;

    for (const respawn of respawns) {
      if (respawn.current) {
        respawn.history.push({
          discordId: respawn.current.discordId,
          characters: respawn.current.characters,
          startTime: respawn.current.startTime,
          endTime: new Date()
        });
        respawn.current = null;
        removedCurrent++;
      }

      if (respawn.queue.length > 0) {
        removedFromQueue += respawn.queue.length;
        respawn.queue = [];
      }

      resolveActiveCall(respawn.code);
      await respawn.save();
    }

    const totalRemoved = removedFromQueue + removedCurrent;

    return interaction.editReply({
      content: `🧹 All caves have been successfully cleared.\n` +
               `• ${removedCurrent} players removed as current\n` +
               `• ${removedFromQueue} players removed from queues\n` +
               `• Total: ${totalRemoved} players removed.`
    });
  }
};
