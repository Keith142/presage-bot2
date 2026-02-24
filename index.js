const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const fs = require("fs");
const config = require("./config");
const commandHandler = require("./handlers/commandHandler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel]
});

/* ============================= */
/* 🔹 VARIABLES GLOBALES */
/* ============================= */

client.testersActivos = new Map();
client.colaGlobal = [];
client.mensajeCola = null;
client.ultimaVezActivo = null;
client.testersConTickets = new Map();
client.usuariosEnColaTiempos = new Map();

/* ============================= */
/* 🔹 READY */
/* ============================= */

client.once("ready", async () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);

  await commandHandler(client);

  setInterval(verificarTestersInactivos, 10 * 60 * 1000);
  setInterval(verificarUsuariosEnCola, 5 * 60 * 1000);
});

/* ============================= */
/* 🔹 EMBED ESTADO */
/* ============================= */

function crearEmbedEstado() {
  const embed = new EmbedBuilder()
    .setTitle("Estado del Testeo")
    .setColor(0x3498db);

  if (client.testersActivos.size === 0) {
    embed.setDescription(
      "No hay Tester disponibles en este momento.\n" +
      "Recibirás un aviso cuando haya un Tester disponible.\n" +
      "¡Vuelve más tarde!"
    );

    if (client.ultimaVezActivo) {
      embed.addFields({
        name: "Última vez con tester activo",
        value: new Date(client.ultimaVezActivo).toLocaleString()
      });
    }

    embed.setImage(config.noTesterImage);

    return { embeds: [embed], components: [] };
  }

  embed.addFields(
    {
      name: "Testers activos",
      value: [...client.testersActivos.keys()].map(id => `<@${id}>`).join("\n")
    },
    {
      name: "Usuarios en cola",
      value: client.colaGlobal.length
        ? client.colaGlobal.map(id => `<@${id}>`).join("\n")
        : "Ninguno"
    }
  );

  const boton = new ButtonBuilder()
    .setCustomId("entrar_cola")
    .setLabel("🍂 Entrar")
    .setStyle(ButtonStyle.Success);

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(boton)]
  };
}

/* ============================= */
/* 🔹 ACTUALIZAR MENSAJE */
/* ============================= */

async function actualizarMensajeCola(channel) {
  try {
    if (!channel) return;

    if (!client.mensajeCola || client.mensajeCola.deleted) {
      const mensajes = await channel.messages.fetch({ limit: 10 });
      client.mensajeCola = mensajes.find(m => m.author.id === client.user.id);

      if (!client.mensajeCola) {
        client.mensajeCola = await channel.send(crearEmbedEstado());
      } else {
        await client.mensajeCola.edit(crearEmbedEstado());
      }
    } else {
      await client.mensajeCola.edit(crearEmbedEstado());
    }
  } catch (err) {
    console.error("Error actualizando mensaje cola:", err);
  }
}

client.actualizarMensajeCola = actualizarMensajeCola;

/* ============================= */
/* 🔹 INTERACCIONES */
/* ============================= */

client.on("interactionCreate", async interaction => {

  /* SLASH COMMANDS */
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands?.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction);
    } catch (error) {
      console.error("Error ejecutando comando:", error);

      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Hubo un error ejecutando el comando.",
          ephemeral: true
        });
      }
    }
  }

  /* BOTONES */
  if (interaction.isButton()) {
    try {
      if (interaction.customId === "entrar_cola") {

        if (interaction.channel.id !== config.testingChannelId)
          return interaction.reply({ content: "Canal incorrecto.", ephemeral: true });

        if (client.colaGlobal.includes(interaction.user.id))
          return interaction.reply({ content: "Ya estás en la cola.", ephemeral: true });

        if (client.colaGlobal.length >= config.maxQueueSize)
          return interaction.reply({ content: "Cola llena.", ephemeral: true });

        client.colaGlobal.push(interaction.user.id);
        client.usuariosEnColaTiempos.set(interaction.user.id, Date.now());

        await actualizarMensajeCola(interaction.channel);

        return interaction.reply({ content: "Te uniste a la cola.", ephemeral: true });
      }
    } catch (err) {
      console.error("Error en botón:", err);

      if (!interaction.replied)
        await interaction.reply({ content: "❌ Error.", ephemeral: true });
    }
  }
});

/* ============================= */
/* 🔹 SISTEMA AUTOMÁTICO */
/* ============================= */

function verificarTestersInactivos() {
  const guild = client.guilds.cache.get(config.guildId);
  const canal = client.channels.cache.get(config.testingChannelId);

  client.testersActivos.forEach(async (_, id) => {
    try {
      const miembro = await guild?.members.fetch(id).catch(() => null);

      if (!miembro?.presence || miembro.presence.status === "offline") {
        if (!client.testersConTickets.has(id)) {
          client.testersActivos.delete(id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  if (client.testersActivos.size === 0) {
    client.ultimaVezActivo = Date.now();
  }

  if (canal) actualizarMensajeCola(canal);
}

function verificarUsuariosEnCola() {
  const ahora = Date.now();
  const canal = client.channels.cache.get(config.testingChannelId);

  client.colaGlobal.forEach(userId => {
    const tiempo = client.usuariosEnColaTiempos.get(userId);

    if (tiempo && ahora - tiempo > 30 * 60 * 1000) {
      client.colaGlobal = client.colaGlobal.filter(id => id !== userId);
      client.usuariosEnColaTiempos.delete(userId);

      const user = client.users.cache.get(userId);
      if (user) {
        user.send("Fuiste removido de la cola por inactividad (30 minutos).").catch(() => {});
      }
    }
  });

  if (canal) actualizarMensajeCola(canal);
}

/* ============================= */
/* 🔹 ERRORES */
/* ============================= */

process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
});

client.login(process.env.TOKEN);