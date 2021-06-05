import {
  BeforeInsert,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { makeId, slugify } from '../../utils/helpers';

@Entity('books')
export default class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  identifier: string;

  @Index()
  @Column()
  title: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  series: string;

  @Column()
  author: string;

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

  // sequel
  // prequel One-To-One Book-Book

  /*
   * TODO
   * to be defined after creating Rating Entity
   */
  // ratings

  /*
   * TODO
   * to be defined after creating Comment Entity
   */
  // comments

  @BeforeInsert()
  makeIdAndSlug() {
    this.identifier = makeId(7);
    this.slug = slugify(this.title);
  }
}
