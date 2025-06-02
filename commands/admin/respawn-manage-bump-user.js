import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_manage_bump_user')
    .setDescription('Forces a player in the queue to occupy the cave')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Player to become the current cave occupant')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Cave code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const code = interaction.options.getString('code');

    const respawn = await Respawn.findOne({ code });
    if (!respawn) {
      return interaction.reply({
        content: `❌ No cave found with code **${code}**.`,
        ephemeral: true
      });
    }

    const inQueue = respawn.queue.find(p => p.discordId === user.id);
    if (!inQueue) {
      return interaction.reply({
        content: `⚠️ User <@${user.id}> is not in the queue for cave **${respawn.name}**.`,
        ephemeral: true
      });
    }

    respawn.queue = respawn.queue.filter(p => p.discordId !== user.id);

    if (respawn.current?.discordId) {
      respawn.queue.unshift({
        discordId: respawn.current.discordId,
        characters: respawn.current.characters,
        joinedAt: new Date()
      });
    }

    respawn.current = {
      discordId: inQueue.discordId,
      characters: inQueue.characters,
      accepted: true,
      startTime: new Date()
    };

    await respawn.save();

    return interaction.reply({
      content: `✅ Player <@${user.id}> is now occupying cave **${respawn.name}**. The previous occupant was moved to the front of the queue.`,
      ephemeral: false
    });
  }
};
