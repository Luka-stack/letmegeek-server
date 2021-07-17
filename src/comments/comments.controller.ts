import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import User from '../users/entities/user.entity';
import Comment from './entities/comment.entity';
import { CommentDto } from './dto/comment.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { PaginatedCommentsDto } from './dto/paginated-comments.dto';

@Controller('api/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/:username')
  createComment(
    @Param('username') username: string,
    @Body() commentDto: CommentDto,
    @GetUser() author: User,
  ): Promise<Comment> {
    return this.commentsService.createComment(username, commentDto, author);
  }

  @Get('/:username')
  getCommentsForUser(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedCommentsDto> {
    return this.commentsService.getCommentsForUser(username, paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Delete('/:identifier')
  deleteComment(
    @Param('identifier') identifier: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.commentsService.deleteComment(identifier, user);
  }
}
