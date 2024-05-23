import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/user.model';
import { Ticket } from '../models/ticket.model';
import dotenv from 'dotenv'

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.MYSQL_HOST,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  models: [User, Ticket]
});

export { sequelize };
