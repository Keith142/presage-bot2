const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const testData = require("../testData.json");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("listatest")
    .setDescription("Muestra el ranking de testers"),

  async execute(interaction) {

    const member = interaction.member;

    const rolesPermitidos = [
      "1322289638773096591", // Owner
      "1322289638773096592"  // Founder
    ];

    const tienePermiso = member.roles.cache.some(r => rolesPermitidos.includes(r.id));

    if (!tienePermiso) {
      return interaction.editReply({
        content: "❌ No tienes permiso.",
        ephemeral: true
      });
    }

    const top = Object.entries(testData)
      .sort((a, b) => b[1] - a[1]);

    if (top.length === 0) {
      return interaction.editReply("No hay datos registrados.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🏆 Ranking de Testers")
      .setColor(0x27ae60);

    top.forEach(([id, cantidad], i) => {
      embed.addFields({
        name: `#${i + 1}`,
        value: `<@${id}> — ${cantidad} tests`
      });
    });

    await interaction.editReply({ embeds: [embed] });
  }
};