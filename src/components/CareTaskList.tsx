import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { getTaskTypeIcon, formatDueDate } from "@/queries/careTasks";
import type { CareTaskWithPlant } from "@/queries/careTasks";
import { cn } from "@/lib/utils";

interface CareTaskCardProps {
  task: CareTaskWithPlant;
  onComplete: (taskId: string) => void;
  isCompleting: boolean;
}

function CareTaskCard({ task, onComplete, isCompleting }: CareTaskCardProps) {
  const isCompleted = !!task.completed_at;
  const dueText = isCompleted && task.completed_at 
    ? `completed ${formatDueDate(task.completed_at)}`
    : formatDueDate(task.due_date);
  const taskIcon = getTaskTypeIcon(task.task_type);
  const plantName = task.plants?.nickname || "Unknown plant";

  const handleClick = () => {
    if (!isCompleted && !isCompleting) {
      onComplete(task.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCompleted || isCompleting}
      className={cn(
        "w-full flex items-center gap-3 p-3 bg-card rounded-xl shadow-card transition-all text-left",
        !isCompleted && "hover:shadow-elevated hover:bg-accent/30 cursor-pointer",
        isCompleted && "opacity-60 cursor-default"
      )}
    >
      {/* Checkbox circle */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          isCompleted
            ? "bg-primary/20 text-primary"
            : "bg-muted hover:bg-primary/10",
          isCompleting && "opacity-50"
        )}
      >
        {isCompleting ? (
          <Loader2 size={16} className="text-primary animate-spin" />
        ) : isCompleted ? (
          <Check size={16} className="text-primary" />
        ) : (
          <span className="w-3 h-3 rounded-full border-2 border-muted-foreground/50" />
        )}
      </div>

      {/* Task info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-semibold truncate",
          isCompleted && "line-through text-muted-foreground"
        )}>
          {task.task_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {plantName} · {dueText}
        </p>
      </div>

      {/* Task type icon */}
      <span className="text-lg flex-shrink-0" role="img" aria-label={task.task_type}>
        {taskIcon}
      </span>
    </button>
  );
}

interface CareTaskListProps {
  title?: string;
  tasks: CareTaskWithPlant[];
  onComplete: (taskId: string) => void;
  completingTaskId?: string | null;
  emptyMessage?: string;
  emptyIcon?: string;
}

export default function CareTaskList({
  title,
  tasks,
  onComplete,
  completingTaskId,
  emptyMessage = "No tasks",
  emptyIcon = "🌿",
}: CareTaskListProps) {
  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-1">
          {title}
        </h3>
      )}
      
      {tasks.length === 0 ? (
        <div className="text-center py-6 px-4">
          <span className="text-2xl" role="img" aria-hidden="true">{emptyIcon}</span>
          <p className="text-sm text-muted-foreground mt-2">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <CareTaskCard
              key={task.id}
              task={task}
              onComplete={onComplete}
              isCompleting={completingTaskId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}