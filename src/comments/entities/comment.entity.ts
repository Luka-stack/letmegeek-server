import { Exclude, Expose } from 'class-transformer';
import { makeId } from 'src/utils/helpers';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import User from '../../users/entities/user.entity';

@Entity('comments')
export default class Comment {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;

  @Index()
  @Column()
  identifier: string;

  @Column({ type: 'text' })
  comment: string;

  @Column()
  author: string;

  @Expose()
  get authorIcon(): string {
    return this.authorRef.imageUrl;
  }

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author', referencedColumnName: 'username' })
  @Exclude()
  authorRef: User;

  @Column()
  recipient: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient', referencedColumnName: 'username' })
  @Exclude()
  recipientRef: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateIdentifier() {
    this.identifier = `${this.author}-${makeId(16)}`;
  }
}
