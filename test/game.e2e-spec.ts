import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { response } from 'express';
import * as request from 'supertest';

import { GamesModule } from '../src/games/games.module';
import { GamesRepository } from '../src/games/games.repository';
import { makeId, slugify } from '../src/utils/helpers';

const mockGamesRepository = {
  createGame: jest.fn((dto) => ({
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: slugify(dto.title),
    identifier: makeId(7),
    ...dto,
  })),
  save: jest.fn((game) => game),
  findOne: jest.fn((payload) => {
    return payload.identifier === 'notfound' ? null : mockGames[0];
  }),
  find: jest.fn(() => mockGames),
  delete: jest.fn((payload) => {
    return payload.identifier === 'notfound'
      ? { affected: 0 }
      : { affected: 1 };
  }),
};

const mockGames = [
  {
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'test-slug',
    identifier: '80Vni9G',
    title: 'Title',
    studio: 'Studio',
    publisher: 'Publisher',
    premiered: new Date(),
    draft: false,
  },
];

const dtoGame = {
  title: 'Title',
  studio: 'Studio',
  description: 'Description',
  publisher: 'Publisher',
  premiered: new Date().toString(),
  draft: false,
};

describe('GamesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GamesModule, TypeOrmModule.forFeature([GamesRepository])],
    })
      .overrideProvider(GamesRepository)
      .useValue(mockGamesRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/api/games (POST)', () => {
    it('return created book and status 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/games')
        .send(dtoGame)
        .expect('Content-Type', /json/)
        .expect(201);
      expect(response.body).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(dtoGame.title),
        ...dtoGame,
      });
    });
  });

  describe('/api/games (GET)', () => {
    it('return list of games and status 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/games')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('/api/games/:identifier (PATCH)', () => {
    it('return status 404', async () => {
      await request(app.getHttpServer())
        .patch('/api/games/notfound')
        .send(dtoGame)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns updated book and status 200', async () => {
      const updatedGame = { ...dtoGame, title: 'Updated' };

      const response = await request(app.getHttpServer())
        .patch('/api/games/123')
        .send(updatedGame)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ ...mockGames[0], ...updatedGame });
    });
  });

  describe('/api/games/:identifier (DELETE)', () => {
    it('return status 404', async () => {
      await request(app.getHttpServer())
        .delete('/api/games/notfound')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return status 204', async () => {
      await request(app.getHttpServer()).delete('/api/games/123').expect(204);
    });
  });
});
