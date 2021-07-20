import { Test, TestingModule } from '@nestjs/testing';
import { GamesReviewsService } from './games-reviews.service';

describe('GamesReviewsService', () => {
  let service: GamesReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamesReviewsService],
    }).compile();

    service = module.get<GamesReviewsService>(GamesReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
