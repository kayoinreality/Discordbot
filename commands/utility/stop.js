const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require ("discord-player")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Para a música e limpa a fila."),

  async execute(interaction) {
    const queue = useQueue(interaction.guild);

    if (!queue) {
      return interaction.reply("❌ Nenhuma música está tocando agora.");
    }

    await queue.node.stop();
    
    return interaction.reply("🛑 Música parada e fila limpa!");
  },
};