const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('salir')
    .setDescription('Salir de la cola de test.'),

  async execute(interaction) {
    const client = interaction.client;
    const config = require('../config');

    // Si no está en la cola
    if (!client.colaGlobal.includes(interaction.user.id)) {
      return interaction.editReply('No estás en la cola.');
    }

    // Remover de la cola
    client.colaGlobal = client.colaGlobal.filter(
      id => id !== interaction.user.id
    );

    client.usuariosEnColaTiempos.delete(interaction.user.id);

    const canal = interaction.guild.channels.cache.get(config.testingChannelId);

    if (canal && client.actualizarMensajeCola) {
      await client.actualizarMensajeCola(canal);
    }

    return interaction.editReply('Saliste de la cola.');
  }
};