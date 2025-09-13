const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { useMainPlayer } = require ("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Toca uma música no canal de voz.")
    .addStringOption(option =>
      option
        .setName("query")
        .setDescription("Nome ou link da música (YouTube, Spotify, SoundCloud)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString("query");
    const player =useMainPlayer();
    const channel = interaction.member.voice.channel;

    if (!channel) {
      return interaction.reply("❌ Você precisa estar em um canal de voz!");
    }

    await interaction.deferReply({ content: `🔎 Procurando por: **${query}**...`, flags: MessageFlags.Ephemeral });
    
    try {
        const { track } = await player.play(channel, query, {
           nodeOptions:{
            metadata: interaction,
           }
        });
        
        return interaction.followUp(`**${track.title}** na fila!`);
    } catch (e) {
    // let's return error if something failed
    return interaction.followUp(`Alguma coisa deu errado: ${e}`);
  }
  },
};