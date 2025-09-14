const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token, spotifyClientId, spotifyClientSecret } = require('./config.json');
const SpotifyWebApi = require('spotify-web-api-node');
const { Player } = require('discord-player');
const { SpotifyExtractor } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require("discord-player-youtubei");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuração da API do Spotify (usada como fallback)
const spotifyApi = new SpotifyWebApi({
  clientId: spotifyClientId,
  clientSecret: spotifyClientSecret
});

async function refreshSpotifyToken() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        console.log('Token de acesso do Spotify foi renovado.');
        spotifyApi.setAccessToken(data.body['access_token']);
        setTimeout(refreshSpotifyToken, data.body['expires_in'] * 1000 - 60000);
    } catch (err) {
        console.error('Não foi possível renovar o token de acesso do Spotify', err);
    }
}

client.once('ready', async () => {
    await refreshSpotifyToken();
});

const player = new Player (client);
player.extractors.register(YoutubeiExtractor, {});
player.extractors.register(SpotifyExtractor, {});


player.events.on('playerStart', async (queue, track) => {
    // Se a música já for do Spotify, envia a URL e pronto.
    if (track.url.includes("spotify")) {
        queue.metadata.channel.send(`Tocando agora: ${track.url}`);
        return;
    }

    // --- MÉTODO 1: Conversão direta da URL (YouTube -> Spotify) ---
    // Verifica se a URL é do YouTube antes de tentar converter.
    if (track.url.includes("youtube.com") || track.url.includes("youtu.be")) {
        try {
            // Chama a API do Odesli para obter os links correspondentes
            const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(track.url)}`);
            if (response.ok) {
                const data = await response.json();
                // Verifica se a resposta contém um link do Spotify
                if (data.linksByPlatform.spotify) {
                    const spotifyUrl = data.linksByPlatform.spotify.url;
                    queue.metadata.channel.send(`Tocando agora: ${spotifyUrl}`);
                    return; // Encontrou com sucesso, não precisa continuar.
                }
            }
        } catch (error) {
            console.error('Erro ao usar a API de conversão de links (Odesli). Usando fallback.', error);
            // Se falhar, o código continua para o método de fallback abaixo.
        }
    }

    // --- MÉTODO 2: Fallback com busca por texto (caso o método 1 falhe) ---
    try {
        const result = await spotifyApi.searchTracks(`${track.title} ${track.author}`, { limit: 1 });

        if (result.body.tracks.items.length > 0) {
            const spotifyTrack = result.body.tracks.items[0];
            const trackUrl = spotifyTrack.external_urls.spotify;
            queue.metadata.channel.send(`Tocando agora: ${trackUrl}`);
        } else {
            queue.metadata.channel.send(`Comecei a tocar **${track.title}**! (Não encontrada no Spotify)`);
        }
    } catch (error) {
        console.error('Erro ao buscar música no Spotify (Fallback):', error);
        queue.metadata.channel.send(`Comecei a tocar **${track.title}**!`);
    }
});


// ... (o resto do seu código permanece o mesmo) ...

// Carregando comandos
client.cooldowns = new Collection();
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] O comando em ${filePath} está faltando a propriedade "data" ou "execute".`);
        }
    }
}

// Carregando eventos do bot
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(token);