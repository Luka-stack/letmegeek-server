import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { makeId, slugify } from '../../utils/helpers';

@Entity('games')
export default class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  identifier: string;

  @Column()
  slug: string;

  @Index()
  @Column()
  title: string;

  @Column()
  studio: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  genres: string;

  @Column()
  publisher: string;

  @Column()
  premiered: Date;

  @Column({ nullable: true })
  imageUrn: string;

  @Column()
  draft: boolean;

  @BeforeInsert()
  makeIdAndSlug() {
    this.identifier = makeId(7);
    this.slug = slugify(this.title);
  }
}
