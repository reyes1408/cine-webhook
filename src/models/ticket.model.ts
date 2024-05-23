
import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model';

@Table({
  timestamps: true,
  tableName: 'ticket'
})
export class Ticket extends Model<Ticket> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  id_user!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  numeroAsiento!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  precio!: Number;
}
