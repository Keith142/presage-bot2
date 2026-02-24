const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('teston')
    .setDescription('Marcarse como tester activo.'),
  new SlashCommandBuilder()
    .setName('testoff')
    .setDescription('Desactivarse como tester.'),
  new SlashCommandBuilder()
    .setName('test')
    .setDescription('Tomar al primer usuario en la cola y crear canal.'),
  new SlashCommandBuilder()
    .setName('finalizartest')
    .setDescription('Finalizar test y cerrar canal de test.'),
  new SlashCommandBuilder()
    .setName('salir')
    .setDescription('Salir de la cola de test.'),
  new SlashCommandBuilder()
    .setName('listatest')
    .setDescription('Mostrar ranking de testers (solo founder/owner).'),
  new SlashCommandBuilder()
    .setName('resultado')
    .setDescription('Registrar resultado del test.')
    .addStringOption(option =>
      option.setName('nick')
        .setDescription('Nick del jugador testeado.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('resultado')
        .setDescription('Resultado del test (Passed, Failed, etc.)')
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('🔄 Registrando comandos...');
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );
    console.log('✅ Comandos registrados correctamente.');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
