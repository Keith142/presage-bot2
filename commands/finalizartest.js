const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('finalizartest')
    .setDescription('Finalizar test y cerrar canal de test.'),

  async execute(interaction) {
    const client = interaction.client;
    const config = require('../config');
    const canal = interaction.channel;

    if (!config.testerRoleIds.some(id => interaction.member.roles.cache.has(id))) {
      return interaction.reply({ content: 'No tienes permisos.', ephemeral: true });
    }

    if (!canal.parent || canal.parent.id !== config.testCategoryId) {
      return interaction.reply({ content: 'Este comando solo se puede usar dentro de un canal de test.', ephemeral: true });
    }

    const mensajes = await canal.messages.fetch({ limit: 100 });

    const contenido = mensajes
      .filter(m => !m.author.bot)
      .map(m => `${m.author.username}: ${m.content}`)
      .reverse()
      .join('\n')
      .slice(0, 4000);

    const canalTranscripcion = interaction.guild.channels.cache.get(config.transcriptionChannelId);

    if (!canalTranscripcion) {
      return interaction.reply({ content: 'No se encontró el canal de transcripción.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("Transcripción del Test Finalizado")
      .setDescription(contenido || "*Sin mensajes para mostrar.*")
      .setColor(0x95a5a6)
      .setFooter({ text: canal.name })
      .setTimestamp();

    try {
      await canalTranscripcion.send({ embeds: [embed] });

      const testerId = [...canal.permissionOverwrites.cache.keys()]
        .find(id => client.testersActivos.has(id));

      if (testerId) client.testersConTickets.delete(testerId);

      await canal.delete();

    } catch (error) {
      console.error("Error en finalizartest:", error);
      return interaction.reply({ content: 'Error al finalizar el test.', ephemeral: true });
    }
  }
};