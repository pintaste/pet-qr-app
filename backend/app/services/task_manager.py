"""
Task manager service for handling background tasks.

This service manages asynchronous task execution and status tracking
for long-running operations like bulk deletions.
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum


class TaskStatus(str, Enum):
    """Task status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Task:
    """Represents a background task."""

    def __init__(self, task_id: str, task_type: str, total_items: int):
        """
        Initialize a task.

        Args:
            task_id: Unique task identifier
            task_type: Type of task (e.g., 'bulk_delete')
            total_items: Total number of items to process
        """
        self.task_id = task_id
        self.task_type = task_type
        self.status = TaskStatus.PENDING
        self.total_items = total_items
        self.processed_items = 0
        self.success_count = 0
        self.fail_count = 0
        self.error_message: Optional[str] = None
        self.created_at = datetime.utcnow()
        self.completed_at: Optional[datetime] = None

    @property
    def progress(self) -> int:
        """Calculate progress percentage."""
        if self.total_items == 0:
            return 100
        return int((self.processed_items / self.total_items) * 100)

    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary."""
        return {
            "task_id": self.task_id,
            "task_type": self.task_type,
            "status": self.status.value,
            "total_items": self.total_items,
            "processed_items": self.processed_items,
            "success_count": self.success_count,
            "fail_count": self.fail_count,
            "progress": self.progress,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class TaskManager:
    """
    Singleton task manager for tracking background tasks.

    For production, this should use Redis or a database for persistence.
    """

    _instance = None
    _tasks: Dict[str, Task] = {}

    def __new__(cls):
        """Create singleton instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._tasks = {}
        return cls._instance

    def create_task(self, task_type: str, total_items: int) -> Task:
        """
        Create a new task.

        Args:
            task_type: Type of task
            total_items: Total number of items to process

        Returns:
            Task: Created task instance
        """
        task_id = str(uuid.uuid4())
        task = Task(task_id, task_type, total_items)
        self._tasks[task_id] = task
        return task

    def get_task(self, task_id: str) -> Optional[Task]:
        """
        Get a task by ID.

        Args:
            task_id: Task identifier

        Returns:
            Task or None if not found
        """
        return self._tasks.get(task_id)

    def update_task_progress(
        self,
        task_id: str,
        processed: int,
        success: int,
        fail: int,
        status: Optional[TaskStatus] = None
    ):
        """
        Update task progress.

        Args:
            task_id: Task identifier
            processed: Number of processed items
            success: Number of successful items
            fail: Number of failed items
            status: Optional new status
        """
        task = self._tasks.get(task_id)
        if task:
            task.processed_items = processed
            task.success_count = success
            task.fail_count = fail
            if status:
                task.status = status
            if status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                task.completed_at = datetime.utcnow()

    def set_task_error(self, task_id: str, error_message: str):
        """
        Set task error message.

        Args:
            task_id: Task identifier
            error_message: Error message
        """
        task = self._tasks.get(task_id)
        if task:
            task.error_message = error_message
            task.status = TaskStatus.FAILED
            task.completed_at = datetime.utcnow()

    def cleanup_old_tasks(self, max_age_hours: int = 24):
        """
        Remove old completed tasks.

        Args:
            max_age_hours: Maximum age in hours for completed tasks
        """
        now = datetime.utcnow()
        to_remove = []
        for task_id, task in self._tasks.items():
            if task.completed_at:
                age = (now - task.completed_at).total_seconds() / 3600
                if age > max_age_hours:
                    to_remove.append(task_id)
        for task_id in to_remove:
            del self._tasks[task_id]


# Global task manager instance
task_manager = TaskManager()
