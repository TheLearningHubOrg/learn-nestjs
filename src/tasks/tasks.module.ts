import { Module } from '@nestjs/common';
import { CLOCK, systemClock } from './clock.js';
import { TasksController } from './tasks.controller.js';
import { InMemoryTasksRepository, TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';

@Module({
  controllers: [TasksController],
  providers: [
    TasksService, // shorthand for { provide: TasksService, useClass: TasksService }
    { provide: TasksRepository, useClass: InMemoryTasksRepository },
    { provide: CLOCK, useValue: systemClock },
  ],
  // Exported so another module that imports TasksModule can inject TasksService.
  exports: [TasksService],
})
export class TasksModule {}
