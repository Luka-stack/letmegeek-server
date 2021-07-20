import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { makeId } from '../../utils/helpers';

export default abstract class Review {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;

  @Column()
  identifier: string;

  @Column({ type: 'text' })
  review: string;

  @Column({ nullable: true })
  art: number;

  @Column({ nullable: true })
  characters: number;

  @Column({ nullable: true })
  story: number;

  @Column({ nullable: true })
  enjoyment: number;

  @Column()
  overall: number;

  @Column()
  username: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  generateIdentifier() {
    this.identifier = `${this.username}-${makeId(16)}`;
  }
}
