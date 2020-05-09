const { DataTypes, Model } = require('sequelize');

module.exports = class Ticket extends Model {
    static init(sequelize) {
        return super.init({
            ticketID: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            authorID: { type: DataTypes.STRING },
            channelID: { type: DataTypes.STRING },
            guildID: { type: DataTypes.STRING },
            open: { type: DataTypes.BOOLEAN },
            department: { type: DataTypes.STRING },
            reason: { type: DataTypes.STRING }
            }, {
            tableName: 'Tickets',
            timestamps: true,
            sequelize
        });
    }
}