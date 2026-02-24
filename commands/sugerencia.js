const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sugerencia")
    .setDescription("Envía una sugerencia al servidor")
    .addStringOption(option =>
      option
        .setName("mensaje")
        .setDescription("Escribe tu sugerencia")
        .setRequired(true)
        .setMaxLength(1000)
    ),

  async execute(interaction) {
    const sugerencia = interaction.options.getString("mensaje");
    const canal = interaction.guild.channels.cache.get(config.suggestionChannelId);

    if (!canal) {
      return interaction.reply({
        content: "No se encontró el canal de sugerencias.",
        ephemeral: true
      });
    }

    if (!canal.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({
        content: "No tengo permisos para enviar mensajes en el canal de sugerencias.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("Nueva Sugerencia")
      .setDescription(sugerencia)
      .addFields({
        name: "Autor",
        value: `<@${interaction.user.id}>`,
        inline: true
      })
      .setColor(0x5865f2)
      .setTimestamp();

    try {
      const msg = await canal.send({ embeds: [embed] });

      await msg.react("✅");
      await msg.react("❌");

      await interaction.reply({
        content: "Tu sugerencia fue enviada correctamente.",
        ephemeral: true
      });
    } catch (error) {
      console.error("Error enviando sugerencia:", error);
      return interaction.reply({
        content: "Ocurrió un error al enviar la sugerencia.",
        ephemeral: true
      });
    }
  }
};