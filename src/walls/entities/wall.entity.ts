import { Exclude } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { IsWallArticleStatus } from '../../utils/validators/wall-status.validator';
import {
  Column,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WallArticleStatus } from './wall-article-status';

export default abstract class Wall {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;

  @Column()
  @IsWallArticleStatus()
  status: WallArticleStatus;

  @Column({ nullable: true })
  @IsNumber()
  score: number;

  @Column()
  @Index()
  username: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
