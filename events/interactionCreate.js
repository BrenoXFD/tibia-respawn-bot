import Respawn from '../models/Respawn.js';
import { resolveActiveCall, activeCalls } from '../helpers/activeCalls.js';

const ROLE_USER = process.env.ROLE_USER;
const ROLE_ADMIN = process.env.ROLE_ADMIN;

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('respawn_accept_')) {
        const caveCode = interaction.customId.split('_').pop();
        const discordId = interaction.user.id;

        const respawn = await Respawn.findOne({ code: caveCode });
        const call = activeCalls.get(caveCode);

        if (
          !respawn ||
          !call ||
          call.discordId !== discordId ||
          (respawn.current && respawn.current.discordId !== discordId)
        ) {
          return interaction.reply({
            content: '❌ This opportunity is no longer available.',
            ephemeral: true
          });
        }

        if (call?.timeoutId) {
          clearTimeout(call.timeoutId);
        }
        activeCalls.delete(caveCode);

        const allRespawns = await Respawn.find({});
        const totalOccupied = allRespawns.reduce((acc, r) => {
          const inQueue = r.queue.some(p => p.discordId === discordId);
          const isCurrent = r.current?.discordId === discordId;
          return acc + (inQueue || isCurrent ? 1 : 0);
        }, 0);

        if (totalOccupied >= 3) {
          return interaction.reply({
            content: `❌ You are already in 3 caves (occupied or in queue). Leave one to join another.`,
            ephemeral: true
          });
        }

        for (const r of allRespawns) {
          if (r.current?.discordId === discordId) {
            if (r.current.startTime) {
              r.history.push({
                discordId,
                characters: r.current.characters,
                startTime: r.current.startTime,
                endTime: new Date()
              });
            }
            r.current = null;
            await r.save();
          }
        }

        const user = respawn.queue.shift();
        respawn.current = {
          discordId: user.discordId,
          characters: user.characters,
          accepted: true,
          startTime: new Date()
        };
        respawn.markModified('current');
        await respawn.save();

        return interaction.reply({
          content: `✅ You are now occupying the cave **${respawn.name}**. Good hunt!`,
          ephemeral: true
        });
      }

      if (interaction.customId.startsWith('respawn_reject_')) {
        const caveCode = interaction.customId.split('_').pop();
        const discordId = interaction.user.id;

        const respawn = await Respawn.findOne({ code: caveCode });
        const call = activeCalls.get(caveCode);

        if (!respawn || !call || call.discordId !== discordId) {
          return interaction.reply({
            content: '❌ This opportunity is no longer available.',
            ephemeral: true
          });
        }

        respawn.queue = respawn.queue.filter(p => p.discordId !== discordId);
        respawn.current = null;
        respawn.markModified('current');
        await respawn.save();

        resolveActiveCall(caveCode, client);

        return interaction.reply({
          content: '❌ You rejected the respawn. Your position has been removed from the queue.',
          ephemeral: true
        });
      }
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      const member = interaction.member;
      const hasAdminRole = member.roles.cache.some(r => r.name === ROLE_ADMIN);
      const hasUserRole = member.roles.cache.some(r => r.name === ROLE_USER);
      const isUserCommand = command.__category === 'user';

      if (isUserCommand && !hasUserRole && !hasAdminRole) {
        return interaction.reply({
          content: '❌ You do not have permission to use this command.',
          ephemeral: true
        });
      }

      if (command.__category === 'admin' && !hasAdminRole) {
        return interaction.reply({
          content: '❌ Only administrators can use this command.',
          ephemeral: true
        });
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        try {
          await interaction.reply({
            content: '❌ Error while executing the command.',
            ephemeral: true
          });
        } catch {
          await interaction.followUp({
            content: '❌ Error while executing the command.',
            ephemeral: true
          });
        }
      }
    }
  }
};
