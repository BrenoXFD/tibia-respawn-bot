import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('respawn_block')
    .setDescription('Adds a respawn block'),

  async execute(interaction) {
    await interaction.reply('⚠️ Command under development.');
  }
};
