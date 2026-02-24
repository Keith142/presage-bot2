const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");
const config = require("../config");

module.exports = async (client) => {
  client.commands = new Map();

  const commandsPath = path.join(__dirname, "../commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

  const commands = [];

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));

    if (!command.data || !command.execute) {
      console.warn(`⚠️ El comando ${file} está mal estructurado`);
      continue;
    }

    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    console.log("🔄 Registrando comandos slash...");

    await rest.put(
      Routes.applicationGuildCommands(
        config.clientId,
        config.guildId
      ),
      { body: commands }
    );

    console.log("✅ Comandos registrados correctamente");
  } catch (error) {
    console.error("❌ Error registrando comandos:", error);
  }
};