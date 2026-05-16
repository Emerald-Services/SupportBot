function getBotInviteUrl(clientId) {
  if (!clientId) return null;
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
}

module.exports = { getBotInviteUrl };
