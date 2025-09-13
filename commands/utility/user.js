import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('user')
    .setDescription('Replies with user information!');
export async function execute(interaction) {
    //await interaction.reply('this command was run by '${interaction.user.tag}', who joined on '${interaction.member.joinedAt}''.');
    await interaction.reply(`This server is ${interaction.user.tag} and has ${interaction.member.joinedAt} members.`);
}