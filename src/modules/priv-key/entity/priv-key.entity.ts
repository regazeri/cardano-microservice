import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * This entity not extends BaseEntity because of this (I don't need DB methods from BaseEntity, check module's repository file):
 * https://stackoverflow.com/questions/59638438/nestjs-typeorm-connecting-to-multiple-databases-connectionnotfounderror
 */
@Entity()
export class PrivKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  symbol: string;

  @Column()
  @Index()
  address: string;

  @Column()
  privKey: string;

  @Column()
  @CreateDateColumn()
  createdAt: string;

  @Column()
  @UpdateDateColumn()
  updatedAt: string;

  @Column({
    default: null,
  })
  deletedAt: string;
}
