import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_next')
    .setDescription('Attempt to enter as the next in line for an occupied cave')
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
      return interaction.reply({ content: `❌ No cave found with code **${code}**.`, ephemeral: true });
    }

    const isOccupied = respawn.current && (respawn.current.accepted || respawn.current.accepted === false);
    if (!isOccupied) {
      return interaction.reply({
        content: `⚠️ The cave **${respawn.name}** is currently free. Use /respawn_claim to occupy it.`,
        ephemeral: true
      });
    }

    const user = await User.findOne({ discordId });
    if (!user || user.characters.length === 0) {
      return interaction.reply({
        content: `❌ You must register at least one character using the /im command.`,
        ephemeral: true
      });
    }

    const alreadyInQueue = respawn.queue.find(p => p.discordId === discordId);
    if (alreadyInQueue || respawn.current?.discordId === discordId) {
      return interaction.reply({
        content: `⚠️ You are already in this cave or its queue.`,
        ephemeral: true
      });
    }

    const entry = {
      discordId,
      characters: user.characters,
      joinedAt: new Date()
    };

    if (respawn.queue.length === 0) {
      respawn.queue.unshift(entry);
    } else {
      respawn.queue.push(entry);
    }

    await respawn.save();

    return interaction.reply({
      content: `📍 You were added ${respawn.queue.length === 1 ? 'as **next**' : 'to the end'} of the queue for cave **${respawn.name}**.`,
      ephemeral: false
    });
  }
};
