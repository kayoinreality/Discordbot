const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Pula a música atual."),

  async execute(interaction) {
    const queue = useQueue(interaction.guild);

    if (!queue) {
      return interaction.reply("❌ A fila está vazia.");
    }

    if (!queue.isPlaying()){
        return interaction.reply('Não há nenhuma música tocando.');
    }

  // Skip the current track
  queue.node.skip();
 
  // Send a confirmation message
  return interaction.reply('A música foi pulada.');
  },
};