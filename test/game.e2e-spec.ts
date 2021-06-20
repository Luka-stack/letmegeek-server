import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import Game from 'src/games/entities/game.entity';
import { GamesController } from 'src/games/games.controller';
import { GamesService } from 'src/games/games.service';
import * as request from 'supertest';

import { GamesRepository } from '../src/games/games.repository';
import { makeId, slugify } from '../src/utils/helpers';

const mockGamesRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  getMangas: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('GamesController (e2e)', () => {
  let app: INestApplication;
  let gamesRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        GamesService,
        { provide: GamesRepository, useFactory: mockGamesRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    gamesRepository = moduleFixture.get(GamesRepository);
    await app.init();
  });

  describe('/api/games (POST)', () => {
    const gameDto = {
      title: 'Newe Title',
      draft: false,
      gears: 'Xbox Series X',
    };

    it('returns created Game and status 201', async () => {
      // given
      gamesRepository.create.mockImplementation((dto) => {
        return {
          id: 'someId',
          identifier: makeId(2),
          slug: slugify(dto.title),
          updatedAt: new Date(),
          createdAt: new Date(),
          ...dto,
        };
      });
      gamesRepository.save.mockResolvedValue({});

      // when them
      const response = await request(app.getHttpServer())
        .post('/api/games')
        .send(gameDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(gameDto.title),
        title: gameDto.title,
        draft: gameDto.draft,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        gears: gameDto.gears,
      });
    });

    it('returns status 409, didnt create Game due to the title not being unique', async () => {
      // given
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      // when then
      await request(app.getHttpServer())
        .post('/api/games')
        .send(gameDto)
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/games (GET)', () => {
    it('returns list of Game and status 200', async () => {
      // given
      gamesRepository.getMangas.mockResolvedValue([new Game()]);

      // when then
      const response = await request(app.getHttpServer())
        .get('/api/games')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('/api/games/:identifier (PATCH)', () => {
    it('Game not found, returns status 404', async () => {
      // given
      gamesRepository.findOne.mockResolvedValue(null);

      // when then
      await request(app.getHttpServer())
        .patch('/api/games/identifier/slug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns updated Game and status 200', async () => {
      // given
      const mockGameClass = new Game();
      mockGameClass.title = 'Old Title';
      mockGameClass.premiered = new Date();

      gamesRepository.findOne.mockResolvedValue(mockGameClass);
      gamesRepository.save.mockResolvedValue({});

      // when
      const gameDto = {
        title: 'Updated One',
        completeTime: 55,
      };
      const response = await request(app.getHttpServer())
        .patch('/api/games/identifier/slug')
        .send(gameDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.title).toEqual(gameDto.title);
      expect(response.body.completeTime).toEqual(gameDto.completeTime);
    });

    it('updates draft to true, returns 200 and updated Game with updated timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockGameClass = new Game();
      mockGameClass.title = 'Old Title';
      mockGameClass.createdAt = date;

      gamesRepository.findOne.mockResolvedValue(mockGameClass);
      gamesRepository.save.mockResolvedValue({});

      // when then
      const response = await request(app.getHttpServer())
        .patch('/api/games/identifier/slug')
        .send({ draft: true })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.createdAt).not.toEqual(date);
    });

    it('draft stays the same, returns 200 and updated Game with old timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockGameClass = new Game();
      mockGameClass.title = 'Old Title';
      mockGameClass.createdAt = date;

      gamesRepository.findOne.mockResolvedValue(mockGameClass);
      gamesRepository.save.mockResolvedValue({});

      // when then
      const response = await request(app.getHttpServer())
        .patch('/api/games/identifier/slug')
        .send({ chapters: 1000 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.createdAt).toEqual(date.toISOString());
    });

    it('returns status 409, didnt create Game due to the title not being unique', async () => {
      // given
      gamesRepository.findOne.mockResolvedValue(new Game());
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      // when then
      await request(app.getHttpServer())
        .patch('/api/games/identifier/slug')
        .send({})
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/games/:identifier (DELETE)', () => {
    it('Game not found, returns status 404', async () => {
      // given
      gamesRepository.delete.mockResolvedValue({ affected: 0 });

      // when then
      await request(app.getHttpServer())
        .delete('/api/games/identifier/slug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('delets Game and return status 204', async () => {
      // given
      gamesRepository.delete.mockResolvedValue({ affected: 1 });

      // when then
      await request(app.getHttpServer())
        .delete('/api/games/identifier/slug')
        .expect(204);
    });
  });
});
