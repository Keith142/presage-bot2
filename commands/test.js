const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Tomar al primer usuario en la cola y crear canal.'),

  async execute(interaction) {
    const client = interaction.client;
    const config = require('../config');
    const guild = interaction.guild;
    const member = interaction.member;

    // Verificar rol tester
    if (!config.testerRoleIds.some(id => member.roles.cache.has(id))) {
      return interaction.reply({ content: 'No tienes permisos.', ephemeral: true });
    }

    // Verificar canal correcto
    if (interaction.channel.id !== config.commandsChannelId) {
      return interaction.reply({ content: 'Este comando solo se puede usar en el canal de comandos.', ephemeral: true });
    }

    // Verificar cola
    if (!client.colaGlobal || client.colaGlobal.length === 0) {
      return interaction.reply({ content: 'No hay usuarios en cola.', ephemeral: true });
    }

    // Verificar si el tester ya tiene ticket
    if (client.testersConTickets.has(member.id)) {
      return interaction.reply({ content: 'Ya tienes un test en curso.', ephemeral: true });
    }

    const userId = client.colaGlobal.shift();
    client.usuariosEnColaTiempos.delete(userId);

    let testUser;
    try {
      testUser = await guild.members.fetch(userId);
    } catch {
      await client.actualizarMensajeCola(guild.channels.cache.get(config.testingChannelId));
      return interaction.reply({ content: 'El usuario ya no está en el servidor.', ephemeral: true });
    }

    const categoria = guild.channels.cache.get(config.testCategoryId);
    if (!categoria) {
      return interaction.reply({ content: 'No se encontró la categoría de test.', ephemeral: true });
    }

    const canal = await guild.channels.create({
      name: `test-${testUser.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      type: ChannelType.GuildText,
      parent: categoria.id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        {
          id: testUser.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: member.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    client.testersConTickets.set(member.id, true);

    await client.actualizarMensajeCola(
      guild.channels.cache.get(config.testingChannelId)
    );

    return interaction.reply({
      content: `Canal creado correctamente: ${canal}`,
      ephemeral: true
    });
  }
};