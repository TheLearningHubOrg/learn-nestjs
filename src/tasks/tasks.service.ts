import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK, type Clock } from './clock.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { UpdateTaskDto } from './dto/update-task.dto.js';
import type { Task } from './task.entity.js';
import { TasksRepository } from './tasks.repository.js';

@Injectable()
export class TasksService {
  constructor(
    // Class token: resolved from the constructor parameter type via emitDecoratorMetadata.
    private readonly repo: TasksRepository,
    // Symbol token: types are erased at runtime, so @Inject() names the token explicitly.
    @Inject(CLOCK) private readonly now: Clock,
  ) {}

  findAll(done?: boolean): Promise<Task[]> {
    return this.repo.findAll({ done });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.repo.findById(id);
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`, { errorCode: 'TASK_NOT_FOUND' });
    }
    return task;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const existing = await this.repo.findAll({ done: false });
    if (existing.some((t) => t.title.toLowerCase() === dto.title.toLowerCase())) {
      throw new ConflictException(`An open task called "${dto.title}" already exists`, {
        errorCode: 'TASK_DUPLICATE_TITLE',
      });
    }
    const stamp = this.now().toISOString();
    return this.repo.insert({
      title: dto.title,
      priority: dto.priority ?? 'medium',
      done: false,
      createdAt: stamp,
      updatedAt: stamp,
    });
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    // Copy only the fields the client sent; a DTO instance is not a plain patch object.
    const patch: Partial<Omit<Task, 'id'>> = { updatedAt: this.now().toISOString() };
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.done !== undefined) patch.done = dto.done;

    const updated = await this.repo.update(id, patch);
    if (!updated) {
      throw new NotFoundException(`Task ${id} not found`, { errorCode: 'TASK_NOT_FOUND' });
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    if (!(await this.repo.delete(id))) {
      throw new NotFoundException(`Task ${id} not found`, { errorCode: 'TASK_NOT_FOUND' });
    }
  }
}
