import { IsArticleName } from '../../utils/validators/article-name.validator';

export class ArticleDraftsFilterDto {
  @IsArticleName()
  article: string;
}
