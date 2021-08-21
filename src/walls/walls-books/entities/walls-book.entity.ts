import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import User from '../../../users/entities/user.entity';
import Book from '../../../articles/books/entities/book.entity';
import Wall from '../../entities/wall.entity';
import { UpdateWallsBookDto } from '../dto/update-walls-book.dto';

@Entity('walls_books')
export default class WallsBook extends Wall {
  @Column({ nullable: true })
  pages: number;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  finishedAt: Date;

  @Exclude()
  @ManyToOne(() => User, (user) => user.wallsBooks, {
    nullable: false,
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Book, {
    eager: false,
    nullable: false,
    onDelete: 'CASCADE',
  })
  book: Book;

  updateFields(updateWallsBookDto: UpdateWallsBookDto) {
    this.status = updateWallsBookDto.status || this.status;
    this.pages = updateWallsBookDto.pages || this.pages;
    this.startedAt = updateWallsBookDto.startedAt || this.startedAt;
    this.finishedAt = updateWallsBookDto.finishedAt || this.finishedAt;
    this.score = updateWallsBookDto.score || this.score;
  }
}
