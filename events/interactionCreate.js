const { Events, MessageFlags, Collection } = require('discord.js');
const { UseMainPlayer } = require ("discord-player");
const SpotifyWebApi = require("spotify-web-api-node");
const { spotifyid, clientsecret } = require("../config.json");
const spotifyApi = new SpotifyWebApi({ clientId: spotifyid, clientSecret: clientsecret });

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};

