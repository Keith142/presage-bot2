const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const testData = require('../testData.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resultado')
    .setDescription('Registrar resultado del test.')
    .addStringOption(option =>
      option.setName('nick')
        .setDescription('Nick del jugador testeado.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('resultado')
        .setDescription('Resultado del test (Passed, Failed, etc.)')
        .setRequired(true)),

  async execute(interaction) {
    const config = require('../config');
    const member = interaction.member;
    const canal = interaction.channel;

    // Permiso tester
    if (!config.testerRoleIds.some(id => member.roles.cache.has(id))) {
      return interaction.editReply('No tienes permisos.');
    }

    // Validar categoría
    if (!canal.parent || canal.parent.id !== config.testCategoryId) {
      return interaction.editReply('Este comando solo se puede usar dentro de un canal de test.');
    }

    const nick = interaction.options.getString('nick');
    const resultado = interaction.options.getString('resultado');

    const embed = new EmbedBuilder()
      .setTitle('Resultado del Test')
      .addFields(
        { name: 'Tester', value: `<@${member.id}>`, inline: true },
        { name: 'Nick', value: nick, inline: true },
        { name: 'Resultado', value: resultado, inline: false }
      )
      .setThumbnail(`https://minotar.net/avatar/${encodeURIComponent(nick)}`)
      .setColor(0xe74c3c)
      .setTimestamp()
      .setFooter({ text: `Test realizado por ${member.user.username}` });

    const canalResultados = interaction.guild.channels.cache.get(config.resultsChannelId);

    if (!canalResultados) {
      return interaction.editReply('No se encontró el canal de resultados.');
    }

    await canalResultados.send({ embeds: [embed] });

    // Guardar contador
    if (!testData[member.id]) testData[member.id] = 0;
    testData[member.id]++;

    fs.writeFileSync('./testData.json', JSON.stringify(testData, null, 2));

    return interaction.editReply('Resultado enviado correctamente.');
  }
};