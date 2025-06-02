import { SlashCommandBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';
import User from '../../models/User.js';
import { isCavePending } from '../../helpers/activeCalls.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_claim')
    .setDescription('Try to claim a cave or join the queue if it is occupied')
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

    const user = await User.findOne({ discordId });
    if (!user || user.characters.length === 0) {
      return interaction.reply({ content: `❌ You need to register at least one character using the /im command.`, ephemeral: true });
    }

    const alreadyQueued = respawn.queue.find(p => p.discordId === discordId);
    if (alreadyQueued || respawn.current?.discordId === discordId) {
      return interaction.reply({ content: `⚠️ You are already in this cave or queue.`, ephemeral: true });
    }

    const allRespawns = await Respawn.find({});
    const totalCaves = allRespawns.reduce((acc, r) => {
      const inQueue = r.queue.some(p => p.discordId === discordId);
      const isCurrent = r.current?.discordId === discordId;
      return acc + (inQueue || isCurrent ? 1 : 0);
    }, 0);

    if (totalCaves >= 3) {
      return interaction.reply({
        content: `❌ You are already in 3 caves (as current or in queue). Leave one to enter another.`,
        ephemeral: true
      });
    }

    for (const r of allRespawns) {
      if (r.current?.discordId === discordId) {
        r.history.push({
          discordId,
          characters: r.current.characters,
          startTime: r.current.startTime,
          endTime: new Date()
        });
        r.current = null;
        await r.save();
      }
    }

    if (respawn.current?.startTime) {
      const start = new Date(respawn.current.startTime);
      const now = new Date();
      const elapsed = (now - start) / 60000;
      if (elapsed >= 195) {
        respawn.history.push({
          discordId: respawn.current.discordId,
          characters: respawn.current.characters,
          startTime: start,
          endTime: now
        });
        respawn.current = null;
      }
    }

    if (
      (respawn.current == null || respawn.current?.discordId === undefined) &&
      !isCavePending(code) &&
      respawn.queue.length === 0
    ) {
      respawn.current = {
        discordId,
        characters: user.characters,
        accepted: true,
        startTime: new Date()
      };
      await respawn.save();

      return interaction.reply({
        content: `✅ You have successfully claimed the cave **${respawn.name}**. Happy hunting!`,
        ephemeral: false
      });
    }

    respawn.queue.push({
      discordId,
      characters: user.characters,
      joinedAt: new Date()
    });
    await respawn.save();

    return interaction.reply({
      content: `⏳ The cave **${respawn.name}** is currently occupied. You have been added to the queue.`,
      ephemeral: false
    });
  }
};
