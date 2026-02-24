const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teston')
    .setDescription('Marcarse como tester activo.'),

  async execute(interaction) {
    const client = interaction.client;
    const config = require('../config');
    const member = interaction.member;

    // Verificar rol tester
    if (!config.testerRoleIds.some(id => member.roles.cache.has(id))) {
      return interaction.reply({ content: 'No tienes permisos.', ephemeral: true });
    }

    // Verificar canal correcto
    if (interaction.channel.id !== config.commandsChannelId) {
      return interaction.reply({
        content: 'Este comando solo se puede usar en el canal de comandos.',
        ephemeral: true
      });
    }

    // Evitar duplicados
    if (client.testersActivos.has(member.id)) {
      return interaction.reply({
        content: 'Ya estás marcado como tester activo.',
        ephemeral: true
      });
    }

    client.testersActivos.set(member.id, true);

    await client.actualizarMensajeCola(
      interaction.guild.channels.cache.get(config.testingChannelId)
    );

    return interaction.reply({
      content: 'Ahora estás activo como tester.',
      ephemeral: true
    });
  }
};