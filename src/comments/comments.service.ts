import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import User from '../users/entities/user.entity';
import Comment from './entities/comment.entity';
import { UserRole } from '../auth/entities/user-role';
import { CommentDto } from './dto/comment.dto';
import { UsersRepository } from '../users/users.repository';
import { CommentsRepository } from './comments.repository';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { PaginatedCommentsDto } from './dto/paginated-comments.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentsRepository)
    private readonly commentsRepository: CommentsRepository,
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async createComment(
    username: string,
    commentDto: CommentDto,
    author: User,
  ): Promise<Comment> {
    const recipiant = await this.usersRepository.findOne({ username });
    if (!recipiant) {
      throw new NotFoundException('User not found');
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

    const nextPage = `${this.configService.get(
      'APP_URL',
    )}/api/comments/${username}?page=${page + 1}&limit=${limit}`;
    const prevPage = `${this.configService.get(
      'APP_URL',
    )}/api/comments/${username}?page=${page - 1}&limit=${limit}`;

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
