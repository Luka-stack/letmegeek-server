import { Test, TestingModule } from '@nestjs/testing';
import { MangasReviewsService } from './mangas-reviews.service';

describe('MangasReviewsService', () => {
  let service: MangasReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MangasReviewsService],
    }).compile();

    service = module.get<MangasReviewsService>(MangasReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
