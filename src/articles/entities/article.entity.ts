import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  Column,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { makeId, slugify } from '../../utils/helpers';

export default abstract class Article {
  @PrimaryGeneratedColumn('uuid')
  @Exclude()
  id: string;

  @Index()
  @Column()
  identifier: string;

  @Index()
  @Column()
  slug: string;

  @Index({ unique: true })
  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  authors: string;

  @Column({ nullable: true })
  publishers: string;

  @Column({ nullable: true })
  genres: string;

  @Column()
  draft: boolean;

  @Column({ nullable: true })
  contributor: string;

  @Column({ nullable: true })
  accepted: boolean;

  @Column()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  makeIdAndSlug() {
    this.identifier = makeId(8);
    this.slug = slugify(this.title);
  }
}
