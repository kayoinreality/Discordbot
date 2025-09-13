const { SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Pula a música atual"),

  async execute(interaction) {
    const player = useMainPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply("❌ Nenhuma música está tocando agora.");
    }

    await queue.node.skip();
    return interaction.reply("⏭️ Música pulada!");
  },
};