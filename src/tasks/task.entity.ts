export type TaskPriority = 'low' | 'medium' | 'high';

export const TASK_PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high'];

export interface Task {
  id: number;
  title: string;
  priority: TaskPriority;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}
