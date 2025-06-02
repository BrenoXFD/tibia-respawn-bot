import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import axios from 'axios';
import crypto from 'crypto';
import User from '../../models/User.js';

export default {
  data: new SlashCommandBuilder()
    .setName('im')
    .setDescription('Register a character to your profile')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Character name')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const rawName = interaction.options.getString('name');
    const discordId = interaction.user.id;
    const code = crypto.randomInt(100000, 999999).toString();

    let nameFromTibia;
    try {
      const response = await axios.get(`https://api.tibiadata.com/v4/character/${encodeURIComponent(rawName)}`);
      const info = response.data?.character?.character;

      const world = process.env.TIBIA_WORLD;

      if (!info || !info.name || info.world !== world) {
        return interaction.editReply({
          content: `❌ Character **${rawName}** does not exist or is not on the world **${world}**.`
        });
      }

      nameFromTibia = info.name;
    } catch (err) {
      console.error('❌ Error validating character from API:', err);
      return interaction.editReply({
        content: '❌ Failed to validate character. Please try again later.'
      });
    }

    const nick = nameFromTibia;

    const user = await User.findOne({ discordId }) || new User({ discordId, characters: [] });

    if (user.characters.includes(nick)) {
      return interaction.editReply({
        content: `❌ You have already registered the character **${nick}**.`
      });
    }

    const allUsers = await User.find();
    const alreadyRegistered = allUsers.find(u =>
      u.characters.some(c => c.toLowerCase() === nick.toLowerCase())
    );

    if (alreadyRegistered) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirmar_${nick}_${code}`)
          .setLabel('✅ I Confirmed')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.editReply({
        content:
          `⚠️ Character **${nick}** is already registered by another user.\n\n` +
          `If it's yours, add the code \`${code}\` to the character's profile comment on Tibia.com.\n` +
          `Then click the button below to confirm.\n\n` +
          `⏱️ You have 3 minutes to confirm. You can click multiple times if needed.`,
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        time: 3 * 60_000,
        filter: i =>
          i.user.id === discordId &&
          i.customId === `confirmar_${nick}_${code}`
      });

      let resolved = false;

      collector.on('collect', async i => {
        try {
          await i.deferUpdate();

          const response = await axios.get(
            `https://api.tibiadata.com/v4/character/${encodeURIComponent(nick)}`
          );
          const info = response.data?.character?.character;

          if (info?.comment?.includes(code)) {
            await User.updateMany(
              { characters: nick, discordId: { $ne: user.discordId } },
              { $pull: { characters: nick } }
            );

            user.characters.push(nick);
            await user.save();

            await interaction.editReply({
              content: `✅ Character **${nick}** successfully registered!`,
              components: []
            });

            resolved = true;
            collector.stop();
          } else {
            await interaction.editReply({
              content: `❌ Code **not found** in the profile of character **${nick}**. Please try again after updating the profile.`,
              components: i.message.components
            });
          }
        } catch (error) {
          console.error('❌ Error validating confirmation via TibiaData:', error);
          await interaction.editReply({
            content: '❌ Failed to validate character. Please try again later.',
            components: i.message.components
          });
        }
      });

      collector.on('end', async () => {
        if (!resolved) {
          await interaction.editReply({
            content: '⏱️ Time expired. Run the command again to try once more.',
            components: []
          });
        }
      });

    } else {
      user.characters.push(nick);
      await user.save();
      await interaction.editReply({
        content: `✅ Character **${nick}** successfully registered!`
      });
    }
  }
};
