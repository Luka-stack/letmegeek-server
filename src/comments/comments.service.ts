import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersRepository } from 'src/users/users.repository';

import User from '../users/entities/user.entity';
import Comment from './entities/comment.entity';
import { CommentDto } from './dto/comment.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { PaginatedCommentsDto } from './dto/paginated-comments.dto';
import { CommentsRepository } from './comments.repository';
import { UserRole } from 'src/auth/entities/user-role';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentsRepository)
    private readonly commentsRepository: CommentsRepository,
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
  ) {}

  async createComment(
    username: string,
    commentDto: CommentDto,
    author: User,
  ): Promise<Comment> {
    const recipiant = await this.usersRepository.findOne({ username });
    if (!recipiant) {
      throw new NotFoundException('Uset not found');
    }

    const comment = this.commentsRepository.create({
      authorRef: author,
      recipientRef: recipiant,
      ...commentDto,
    });
    await this.commentsRepository.save(comment);

    return comment;
  }

  async getCommentsForUser(
    username: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedCommentsDto> {
    const limit = Number(paginationDto.limit);
    const page = Number(paginationDto.page);
    const skippedItems = (page - 1) * limit;

    const totalCount = await this.commentsRepository.commentsCount(username);
    const comments = await this.commentsRepository.getCommentsForUser(
      username,
      skippedItems,
      limit,
    );

    const nextPage = `http://localhost:5000/api/comments/${username}?page=${
      page + 1
    }&limit=${limit}`;
    const prevPage = `http://localhost:5000/api/comments/${username}?page=${
      page - 1
    }&limit=${limit}`;

    return {
      totalCount,
      page,
      limit,
      data: comments,
      nextPage: page * limit < totalCount ? nextPage : '',
      prevPage: page >= 2 ? prevPage : '',
    };
  }

  async deleteComment(identifier: string, user: User): Promise<void> {
    let result;
    if (user.role === UserRole.ADMIN) {
      result = await this.commentsRepository.delete({ identifier });
    } else {
      result = await this.commentsRepository.deleteUserComment(
        identifier,
        user.username,
      );
    }

    if (result.affected === 0) {
      throw new NotFoundException('Comment not found');
    }
  }
}
