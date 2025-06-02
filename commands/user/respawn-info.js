import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_info')
    .setDescription('Shows the current player and the queue for a cave')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Cave code')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const code = interaction.options.getString('code');
    const respawn = await Respawn.findOne({ code });

    if (!respawn) {
      return interaction.editReply({
        content: `❌ No cave found with code **${code}**.`
      });
    }

    const now = new Date();
    let status = 'Free';
    let remainingTime = null;
    let current = null;

    if (respawn.current?.discordId) {
      current = `<@${respawn.current.discordId}> (${respawn.current.characters.join(' / ')})`;

      if (respawn.current.startTime) {
        const start = new Date(respawn.current.startTime);
        const end = new Date(start.getTime() + 195 * 60000);
        const diff = Math.max(0, end - now);
        const min = Math.floor(diff / 60000);
        const hrs = String(Math.floor(min / 60)).padStart(2, '0');
        const rem = String(min % 60).padStart(2, '0');
        remainingTime = `${hrs}h ${rem}min`;
        status = current;
      } else {
        status = `⏳ Pending: ${current}`;
      }
    }

    const currentIsPending = respawn.current?.discordId && !respawn.current?.startTime;
    const currentPendingId = currentIsPending ? respawn.current.discordId : null;

    const queue = (respawn.queue || [])
      .filter(u => u.discordId !== currentPendingId)
      .map((u, i) =>
        `${i + 1}. <@${u.discordId}> (${u.characters.join(' / ')})`
      );

    const embed = new EmbedBuilder()
      .setTitle(`📍 ${respawn.code} - ${respawn.name}`)
      .addFields(
        { name: '🎯 Status', value: status, inline: false },
        { name: '🕒 Remaining Time', value: remainingTime ?? 'Free', inline: false },
        {
          name: '**Next:**',
          value: queue.length ? queue.join('\n') : 'No players in queue.',
          inline: false
        }
      )
      .setColor(0xe3d510)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
