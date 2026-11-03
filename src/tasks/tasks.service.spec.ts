import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CLOCK } from './clock.js';
import { InMemoryTasksRepository, TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

describe('TasksService', () => {
  let service: TasksService;
  let current: Date;

  beforeEach(async () => {
    current = new Date('2026-01-01T09:00:00.000Z');
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useClass: InMemoryTasksRepository },
        // A fake clock makes timestamps assertable.
        { provide: CLOCK, useValue: () => current },
      ],
    }).compile();

    service = moduleRef.get(TasksService);
  });

  it('creates a task with defaults and the injected clock time', async () => {
    const task = await service.create({ title: 'Write tests' });

    expect(task).toEqual({
      id: 1,
      title: 'Write tests',
      priority: 'medium',
      done: false,
      createdAt: '2026-01-01T09:00:00.000Z',
      updatedAt: '2026-01-01T09:00:00.000Z',
    });
  });

  it('rejects a duplicate open title, ignoring case', async () => {
    await service.create({ title: 'Ship it' });

    await expect(service.create({ title: 'SHIP IT' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates fields and bumps updatedAt only', async () => {
    const created = await service.create({ title: 'Refactor' });
    current = new Date('2026-01-02T10:30:00.000Z');

    const updated = await service.update(created.id, { done: true });

    expect(updated.done).toBe(true);
    expect(updated.createdAt).toBe('2026-01-01T09:00:00.000Z');
    expect(updated.updatedAt).toBe('2026-01-02T10:30:00.000Z');
  });

  it('filters by done', async () => {
    const a = await service.create({ title: 'a' });
    await service.create({ title: 'b' });
    await service.update(a.id, { done: true });

    expect((await service.findAll(true)).map((t) => t.title)).toEqual(['a']);
    expect((await service.findAll(false)).map((t) => t.title)).toEqual(['b']);
    expect(await service.findAll()).toHaveLength(2);
  });

  it('throws NotFoundException with a machine-readable code', async () => {
    const error = await service.findOne(99).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toMatchObject({
      errorCode: 'TASK_NOT_FOUND',
    });
  });

  it('returns copies, so callers cannot mutate stored rows', async () => {
    const created = await service.create({ title: 'Immutable' });
    created.title = 'mutated';

    expect((await service.findOne(created.id)).title).toBe('Immutable');
  });
});
