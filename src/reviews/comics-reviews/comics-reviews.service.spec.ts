import { Test, TestingModule } from '@nestjs/testing';
import { ComicsReviewsService } from './comics-reviews.service';

describe('ComicsReviewsService', () => {
  let service: ComicsReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComicsReviewsService],
    }).compile();

    service = module.get<ComicsReviewsService>(ComicsReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
