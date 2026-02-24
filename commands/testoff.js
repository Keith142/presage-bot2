const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testoff')
    .setDescription('Desactivarse como tester.'),

  async execute(interaction) {
    const client = interaction.client;
    const config = require('../config');
    const member = interaction.member;

    if (!config.testerRoleIds.some(id => member.roles.cache.has(id))) {
      return interaction.reply({ content: 'No tienes permisos.', ephemeral: true });
    }

    if (interaction.channel.id !== config.commandsChannelId) {
      return interaction.reply({
        content: 'Este comando solo se puede usar en el canal de comandos.',
        ephemeral: true
      });
    }

    if (!client.testersActivos.has(member.id)) {
      return interaction.reply({
        content: 'No estás activo como tester.',
        ephemeral: true
      });
    }

    if (client.testersConTickets.has(member.id)) {
      return interaction.reply({
        content: 'No puedes desactivarte mientras tienes un test en curso.',
        ephemeral: true
      });
    }

    // 🔥 Eliminar del mapa
    client.testersActivos.delete(member.id);

    // 🔥 Si ya no queda nadie activo, guardar hora
    if (client.testersActivos.size === 0) {
      client.ultimaVezActivo = Date.now();
    }

    // 🔥 Forzar actualización inmediata
    const canal = interaction.guild.channels.cache.get(config.testingChannelId);
    if (canal) await client.actualizarMensajeCola(canal);

    return interaction.reply({
      content: 'Te desactivaste como tester correctamente.',
      ephemeral: true
    });
  }
};