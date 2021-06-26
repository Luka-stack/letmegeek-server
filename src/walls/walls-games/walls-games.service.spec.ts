import { Test, TestingModule } from '@nestjs/testing';
import { WallsGamesService } from './walls-games.service';

describe('WallsGamesService', () => {
  let service: WallsGamesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WallsGamesService],
    }).compile();

    service = module.get<WallsGamesService>(WallsGamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
