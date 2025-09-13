const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useMainPlayer, QueryType } = require("discord-player");
const SpotifyWebApi = require("spotify-web-api-node");

// Configura o cliente do Spotify
const { spotifyid, clientsecret, redirecturl } = require("../../config.json");
const spotifyApi = new SpotifyWebApi({ clientId: spotifyid, clientSecret: clientsecret, redirecturl });

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
        .setDescription("Nome ou link da música")
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
      await interaction.deferReply();

      let result;
      const queryLower = query.toLowerCase();

      // --- NOVA LÓGICA DE ROTEAMENTO MANUAL ---

      // Caso 1: A query é um link do YouTube Music
      if (queryLower.includes("music.youtube.com")) {
        result = await player.search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE_MUSIC,
        });
      }
      // Caso 2: A query é um link do YouTube normal
      else if (queryLower.includes("youtube.com") || queryLower.includes("youtu.be")) {
        result = await player.search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE_VIDEO,
        });
      }
      // Caso 3: A query é um link do Spotify
      else if (queryLower.includes("http://googleusercontent.com/spotify.com/18")) {
        const searchText = await getTrackFromSpotify(query);
        // Busca o texto do spotify no youtube music
        result = await player.search(searchText, {
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE_MUSIC,
        });
      }
      // Caso 4: A query é um texto para busca
      else {
        result = await player.search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE_MUSIC, // Prioriza YT Music para precisão
        });
      }

      // Fallback final: Se nenhuma das lógicas acima encontrar algo, tenta uma busca geral no YouTube
      if (!result || !result.tracks.length) {
        result = await player.search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE_VIDEO,
        });
      }

      if (!result || !result.tracks.length) {
        return interaction.editReply(`❌ Não encontrei resultados para "${query}"!`);
      }

      const track = result.tracks[0];
      await player.play(channel, track, {
        nodeOptions: { metadata: interaction.channel },
      });

      const embed = new EmbedBuilder()
        // ... (código do embed continua o mesmo)
        .setColor('#0099ff')
        .setTitle(track.title)
        .setURL(track.url)
        .setAuthor({ name: track.author })
        .setThumbnail(track.thumbnail)
        .addFields({ name: 'Duração', value: track.duration, inline: true })
        .setTimestamp()
        .setFooter({ text: `Adicionada por ${interaction.user.tag}` });

      await interaction.editReply({ content: `🎶 Adicionado à fila:`, embeds: [embed] });

    } catch (error) {
      console.error("Erro no comando /play:", error);
      return interaction.editReply("❌ Ocorreu um erro ao tentar tocar a música.");
    }
  },
};