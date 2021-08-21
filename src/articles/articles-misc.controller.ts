import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import User from '../users/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ArticlesMiscService } from './articles-misc.service';
import { ArticleDraftsFilterDto } from './dto/article-drafts-flter.dto';
import { ArticleDraftDto } from './dto/article-drafts.dto';

@Controller('api/articles/misc')
export class ArticlesMiscController {
  constructor(private readonly articlesMiscService: ArticlesMiscService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/drafts')
  getDrafts(
    @GetUser() user: User,
    @Query() articleDraftsFilter: ArticleDraftsFilterDto,
  ): Promise<ArticleDraftDto> {
    return this.articlesMiscService.getDrafts(user, articleDraftsFilter);
  }
}
