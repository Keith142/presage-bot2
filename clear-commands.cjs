const { REST, Routes } = require('discord.js');
const config = require('./config.js');

const CLIENT_ID = '1388993002009268425';
const GUILD_ID = '1322289638731157516';

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('❌ Eliminando comandos del servidor...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

    console.log('❌ Eliminando comandos globales...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });

    console.log('✅ Comandos eliminados correctamente.');
  } catch (error) {
    console.error('❌ Error al eliminar comandos:', error);
  }
})();
