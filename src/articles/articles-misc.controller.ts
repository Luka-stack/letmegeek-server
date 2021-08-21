import { Controller, Get, Query } from '@nestjs/common';
import { ArticlesMiscService } from './articles-misc.service';
import { ArticleDraftsFilterDto } from './dto/article-drafts-flter.dto';
import { ArticleDraftDto } from './dto/article-drafts.dto';

@Controller('api/articles/misc')
export class ArticlesMiscController {
  constructor(private readonly articlesMiscService: ArticlesMiscService) {}

  @Get()
  getDrafts(
    @Query() articleDraftsFilter: ArticleDraftsFilterDto,
  ): Promise<ArticleDraftDto> {
    return this.articlesMiscService.getDrafts(articleDraftsFilter);
  }
}
