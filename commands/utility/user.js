const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Replies with user information!'),
    async execute(interaction) {
        await interaction.reply(`Este comando foi executado por ${interaction.user.tag}, que entrou em ${interaction.member.joinedAt}.`);
    }
};