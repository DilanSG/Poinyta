export type TaskPriority = "high" | "medium" | "low";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  category: string;
  dueDate: string | null;
  reminder: string | null;
  createdAt: string;
};

export type NoteEntityType = "task" | "goal" | "goal_step";

export type NoteLink = {
  id: number;
  noteId: string;
  entityType: NoteEntityType;
  entityId: string;
};

export type Note = {
  id: string;
  title: string | null;
  content: string;
  pinned: boolean;
  createdAt: string;
  links: NoteLink[];
};

export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
};

export type WishItem = {
  id: string;
  title: string;
  link: string;
  amount?: number;
  image?: string;
  description?: string;
  category: string;
  createdAt: string;
};

export type GoalStatus = "active" | "completed" | "paused";

export type GoalStep = {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  completed: boolean;
  stepOrder: number;
  unlockedAt: string | null;
};

export type Goal = {
  id: string;
  title: string;
  description?: string;
  status: GoalStatus;
  targetDate?: string;
  createdAt: string;
  completedAt?: string;
  steps: GoalStep[];
};

export type PeriodPoint = {
  income: number;
  expenses: number;
};

export type NotificationType = "info" | "success" | "warning" | "error";

export type AppNotification = {
  id: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
};
