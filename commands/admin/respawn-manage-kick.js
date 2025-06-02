import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import { checkRespawnQueue } from '../../jobs/checkRespawnQueue.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_manage_kick')
    .setDescription('Removes a player from the cave or queue, calling the next one')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Player to remove')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const target = interaction.options.getUser('user');
    const targetId = target.id;

    const caves = await Respawn.find({
      $or: [
        { 'current.discordId': targetId },
        { 'queue.discordId': targetId }
      ]
    });

    if (caves.length === 0) {
      return interaction.reply({ content: `⚠️ User <@${targetId}> is not in any cave or queue.`, ephemeral: true });
    }

    let result = [];
    for (const cave of caves) {
      let action = '';
      let callNext = false;

      if (cave.current?.discordId === targetId) {
        cave.history.push({
          discordId: targetId,
          characters: cave.current.characters,
          startTime: cave.current.startTime,
          endTime: new Date()
        });
        cave.current = null;
        action = 'removed as current occupant';
        callNext = true;
      }

      const initialQueueLength = cave.queue.length;
      cave.queue = cave.queue.filter(p => p.discordId !== targetId);
      if (cave.queue.length < initialQueueLength && !action) {
        action = 'removed from queue';
      }

      if (action) {
        await cave.save();
        result.push(`📍 **${cave.name}** (${action})`);
        if (callNext) await checkRespawnQueue(client);
      }
    }

    if (result.length === 0) {
      return interaction.reply({ content: `⚠️ No changes were made for <@${targetId}>.`, ephemeral: true });
    }

    return interaction.reply({
      content: `✅ Actions performed for <@${targetId}>:\n` + result.join('\n'),
      ephemeral: false
    });
  }
};
