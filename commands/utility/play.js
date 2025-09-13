const { SlashCommandBuilder, EmbedBuilder } = require("discord.js"); // Importe o EmbedBuilder
const { useMainPlayer } = require("discord-player");
const SpotifyWebApi = require("spotify-web-api-node");

// Configura o cliente do Spotify
const { spotifyid, clientsecret, redirecturl } = require("../../config.json");
const spotifyApi = new SpotifyWebApi({ clientId: spotifyid, clientSecret: clientsecret, redirecturl });

// Função auxiliar: busca metadados no Spotify
async function getTrackFromSpotify(url) {
  const trackId = url.split("/track/")[1].split("?")[0];
  const data = await spotifyApi.getTrack(trackId);
  const track = data.body;
  return `${track.name} ${track.artists[0].name}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Toca uma música no canal de voz")
    .addStringOption(option =>
      option
        .setName("query")
        .setDescription("Nome ou link da música (YouTube/Spotify)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const player = useMainPlayer();
    const query = interaction.options.getString("query");
    const channel = interaction.member.voice.channel;

    if (!channel) {
      return interaction.reply("❌ Você precisa estar em um canal de voz!");
    }

    try {
      let searchQuery = query;

      // Se for link do Spotify
      if (query.includes("open.spotify.com/track")) {
        const token = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(token.body.access_token);

        searchQuery = await getTrackFromSpotify(query);
        await interaction.reply(`🔎 Buscando no YouTube: **${searchQuery}**...`);
      } else {
        await interaction.reply(`🔎 Procurando: **${query}**...`);
      }

      // Pesquisa e toca
      const result = await player.search(searchQuery, {
        requestedBy: interaction.user,
      });

      if (!result || !result.tracks.length) {
        return interaction.editReply("❌ Não encontrei essa música!");
      }

      const track = result.tracks[0];

      await player.play(channel, track, {
        nodeOptions: {
          metadata: interaction.channel,
        },
      });

      // Cria o embed com as informações da música
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(track.title)
        .setURL(track.url)
        .setAuthor({ name: track.author })
        .setThumbnail(track.thumbnail)
        .addFields({ name: 'Duração', value: track.duration, inline: true })
        .setTimestamp()
        .setFooter({ text: `Adicionada por ${interaction.user.tag}` });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      return interaction.editReply("❌ Ocorreu um erro ao tentar tocar a música.");
    }
  },
};