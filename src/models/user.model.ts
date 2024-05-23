
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  timestamps: true,
  tableName: 'user'
})
export class User extends Model<User> {
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  nombre!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true
  })
  correo!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  pass!: string;
}
