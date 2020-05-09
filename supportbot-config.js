const config = {
    "BOT VERSION": "6.0",

    // General Bot Settings
    "Token": "BOT_TOKEN_HERE",
    "Prefix": "!",
    "Bot_Name": "SupportBot",

    "BotActivity": "SupportBot v5.2",
    "ActivityType": "PLAYING",

    "EmbedFooter": "SupportBot | The #1 Supportive Discord Bot",
    "ErrorColour": "#ff3030",

    // Role Settings
    "SupportStaff": "Support",
    "ManagementStaff": "Management",

    // Ticket Department

    // Ticket Settings
    "TicketStarter": "ticket",
    "TicketCategory": "Support",
    "maxTickets": "5",
    
    // System (Join/Leave) Settings
    "SystemChannel": "system-messages",

    "JoinEnabled": "true", // true / false
    "embed": "true", // true / false
    "WelcomeMessage": "Hello %membertag%, Welcome to %guildname%!", 
    // USE %membertag% and %guildname%  to signify the new members tag and guild name respectively
    
    "LeaveEnabled": "true",
    "embed": "true",
    "LeaveMessage": "Goodbye %membertag%, Thank you for visting %guildname%!", 

    // Suggestion Settings
    "SuggestionChannel": "Suggestions",
    
    // Announcement Settings
    "AnnouncementChannel": "announcements",
    "embed": "true",
    
    // Voting Settings
    "VotingChannel": "vote",

    // Commands Configuration
    "Help_Command": "help"

};
module.exports = config;