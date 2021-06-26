import { Test, TestingModule } from '@nestjs/testing';
import { WallsComicsService } from './walls-comics.service';

describe('WallsComicsService', () => {
  let service: WallsComicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WallsComicsService],
    }).compile();

    service = module.get<WallsComicsService>(WallsComicsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
