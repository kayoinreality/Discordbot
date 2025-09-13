const { SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Para a música e limpa a fila"),

  async execute(interaction) {
    const player = useMainPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply("❌ Nenhuma música está tocando agora.");
    }

    await queue.delete();
    return interaction.reply("🛑 Música parada e fila limpa!");
  },
};