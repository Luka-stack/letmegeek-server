import { Test, TestingModule } from '@nestjs/testing';
import { WallsBooksService } from './walls-books.service';

describe('WallsBooksService', () => {
  let service: WallsBooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WallsBooksService],
    }).compile();

    service = module.get<WallsBooksService>(WallsBooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
