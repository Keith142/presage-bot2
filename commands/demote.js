const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config');

const RANK_LOG_CHANNEL_ID = '1476021791934779392'; // 🍂・ʀᴀɴᴋ-ᴄʜᴀɴɢᴇꜱ

module.exports = {
  data: new SlashCommandBuilder()
    .setName('demote')
    .setDescription('Degradar a un usuario según la jerarquía')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a degradar')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('rol')
        .setDescription('Rol inferior a asignar')
        .setRequired(true)
        .addChoices(
          { name: 'Presage', value: '1322289638760644648' },
          { name: 'Mod', value: '1322289638760644654' },
          { name: 'Co-lider', value: '1322289638760644655' },
          { name: 'Lider', value: '1322289638760644656' },
          { name: 'Co-owner', value: '1322289638760644657' },
          { name: 'Regulator', value: '1466180841947271209' },
          { name: 'Admin', value: '1466180783696773300' }
        )
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ No tienes permisos.', ephemeral: true });
    }

    const miembro = interaction.options.getMember('usuario');
    const rolId = interaction.options.getString('rol');
    const nuevoRol = interaction.guild.roles.cache.get(rolId);

    if (!miembro || !nuevoRol) {
      return interaction.reply({ content: '❌ Usuario o rol inválido.', ephemeral: true });
    }

    const orden = config.promoteOrder;

    const rolActual = [...orden].reverse().find(id => miembro.roles.cache.has(id));
    if (!rolActual) {
      return interaction.reply({ content: '❌ El usuario no tiene rango de staff.', ephemeral: true });
    }

    if (orden.indexOf(rolId) >= orden.indexOf(rolActual)) {
      return interaction.reply({ content: '❌ El rol debe ser inferior.', ephemeral: true });
    }

    for (const id of orden) {
      if (miembro.roles.cache.has(id)) {
        await miembro.roles.remove(id).catch(() => {});
      }
    }

    await miembro.roles.add(nuevoRol);

    const embed = new EmbedBuilder()
      .setTitle('<a:2436terrariasilv:1473826001741025413> DEMOTE <a:2436terrariasilv:1473826001741025413>')
      .setColor(0x4fc3f7) // 💠 celeste
      .setThumbnail(miembro.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        {
          name: 'Usuario',
          value: `${miembro}`,
          inline: true
        },
        {
          name: 'Rol',
          value: `${nuevoRol}`,
          inline: true
        },
        {
          name: 'Moderador',
          value: `${interaction.user}`,
          inline: false
        }
      )
      .setTimestamp(); // fecha pequeña

    // 📤 Enviar log al canal de rank changes
    const logChannel = interaction.guild.channels.cache.get(RANK_LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }

    // ✅ Respuesta del comando
    await interaction.reply({ embeds: [embed] });
  }
};