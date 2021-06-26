import { Test, TestingModule } from '@nestjs/testing';
import { WallsMangasService } from './walls-mangas.service';

describe('WallsMangasService', () => {
  let service: WallsMangasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WallsMangasService],
    }).compile();

    service = module.get<WallsMangasService>(WallsMangasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
