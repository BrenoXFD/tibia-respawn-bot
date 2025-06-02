import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Respawn from '../../models/Respawn.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_history')
    .setDescription('Displays the history of players who used the cave in the last 24h')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Cave code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const code = interaction.options.getString('code');
    const respawn = await Respawn.findOne({ code });

    if (!respawn) {
      return interaction.reply({
        content: `❌ No cave found with code **${code}**.`,
        ephemeral: true
      });
    }

    const limit = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history = respawn.history
      .filter(entry => new Date(entry.endTime) > limit)
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime));

    if (history.length === 0) {
      return interaction.reply({
        content: `📜 No usage recorded for **${respawn.name}** in the last 24 hours.`,
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const lines = history.slice(0, 10).map(entry => {
      const endTime = new Date(entry.endTime);
      const startTime = new Date(entry.startTime);
      const durationMs = endTime - startTime;
      let durationMin = Math.round(durationMs / 60000);
      durationMin = Math.min(durationMin, 195);
      
      const durationFormatted = durationMin >= 60
        ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
        : `${durationMin}m`;

      const time = endTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const chars = entry.characters.join(' / ');
      return `🕒 ${time} — <@${entry.discordId}> (${chars}) stayed **${durationFormatted}**`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`📜 History: ${respawn.name}`)
      .setDescription(lines.join('\n'))
      .setColor(0xe3d510)
      .setFooter({ text: `Last ${lines.length} entries in the past 24h` })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
