import { Sequelize } from 'sequelize';
import { DB_NAME, DB_USER, DB_PASS } from '../supportbot-config';
export default new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    dialect: 'mysql'
});
