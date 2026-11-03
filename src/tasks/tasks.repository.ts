import { Injectable } from '@nestjs/common';
import type { Task } from './task.entity.js';

/**
 * The port the service depends on. An abstract class (not an interface) is used because it
 * survives compilation, so it can be the DI token: providers: [{ provide: TasksRepository, ... }].
 */
export abstract class TasksRepository {
  abstract findAll(filter?: { done?: boolean }): Promise<Task[]>;
  abstract findById(id: number): Promise<Task | undefined>;
  abstract insert(data: Omit<Task, 'id'>): Promise<Task>;
  abstract update(id: number, patch: Partial<Omit<Task, 'id'>>): Promise<Task | undefined>;
  abstract delete(id: number): Promise<boolean>;
}

/** Map-backed adapter. Swap it for a database adapter without touching TasksService. */
@Injectable()
export class InMemoryTasksRepository extends TasksRepository {
  private readonly rows = new Map<number, Task>();
  private nextId = 1;

  async findAll(filter: { done?: boolean } = {}): Promise<Task[]> {
    const all = [...this.rows.values()];
    const matching = filter.done === undefined ? all : all.filter((t) => t.done === filter.done);
    return matching.map((t) => ({ ...t }));
  }

  async findById(id: number): Promise<Task | undefined> {
    const row = this.rows.get(id);
    return row ? { ...row } : undefined;
  }

  async insert(data: Omit<Task, 'id'>): Promise<Task> {
    const task: Task = { id: this.nextId++, ...data };
    this.rows.set(task.id, task);
    return { ...task };
  }

  async update(id: number, patch: Partial<Omit<Task, 'id'>>): Promise<Task | undefined> {
    const current = this.rows.get(id);
    if (!current) return undefined;
    const next: Task = { ...current, ...patch, id };
    this.rows.set(id, next);
    return { ...next };
  }

  async delete(id: number): Promise<boolean> {
    return this.rows.delete(id);
  }
}
