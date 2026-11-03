import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';

const API_KEY = 'test-api-key-123';

describe('Starter API (e2e)', () => {
  let app: INestApplication<App>;
  let AppModule: unknown;

  beforeAll(async () => {
    // ConfigModule.forRoot() runs its load factories when app.module.ts is first evaluated,
    // so the variable must exist before that import. Static imports are hoisted, hence import().
    process.env.API_KEY = API_KEY;
    ({ AppModule } = await import('../src/app.module.js'));
  });

  afterAll(() => {
    delete process.env.API_KEY;
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule as never],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health is public', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.headers['x-request-id']).toMatch(/^[\w-]{8,64}$/);
    expect(res.headers['server-timing']).toMatch(/^app;dur=/);
  });

  it('echoes a valid incoming x-request-id', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('x-request-id', 'trace-abc-123')
      .expect(200);

    expect(res.headers['x-request-id']).toBe('trace-abc-123');
  });

  it('POST /tasks without a key is 401 problem+json', async () => {
    const res = await request(app.getHttpServer()).post('/tasks').send({ title: 'x' }).expect(401);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized', instance: '/tasks' });
  });

  it('rejects unknown and invalid fields with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set('x-api-key', API_KEY)
      .send({ title: '   ', priority: 'urgent', isAdmin: true })
      .expect(400);

    const detail = (res.body.detail as string[]).join(' | ');
    expect(detail).toContain('property isAdmin should not exist');
    expect(detail).toContain('title should not be empty');
    expect(detail).toContain('priority must be one of the following values');
  });

  it('runs a full create, read, update, delete cycle', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/tasks')
      .set('x-api-key', API_KEY)
      .send({ title: '  Learn NestJS  ', priority: 'high' })
      .expect(201);
    expect(created.body).toMatchObject({
      id: 1,
      title: 'Learn NestJS',
      priority: 'high',
      done: false,
    });

    await request(server).get('/tasks/1').expect(200);

    const patched = await request(server)
      .patch('/tasks/1')
      .set('x-api-key', API_KEY)
      .send({ done: true })
      .expect(200);
    expect(patched.body.done).toBe(true);

    const doneList = await request(server).get('/tasks?done=true').expect(200);
    expect(doneList.body).toHaveLength(1);

    await request(server).delete('/tasks/1').set('x-api-key', API_KEY).expect(204);

    const missing = await request(server).get('/tasks/1').expect(404);
    expect(missing.body).toMatchObject({ errorCode: 'TASK_NOT_FOUND', status: 404 });
  });

  it('turns a non-numeric id into 400 via ParseIntPipe', async () => {
    const res = await request(app.getHttpServer()).get('/tasks/abc').expect(400);

    expect(res.body.detail).toContain('numeric string is expected');
  });

  it('answers unknown routes with a 404 problem document', async () => {
    const res = await request(app.getHttpServer()).get('/nope').expect(404);

    expect(res.headers['content-type']).toContain('application/problem+json');
  });
});
