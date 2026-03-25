import { TodoType } from '@/src/types/todo';
import { create } from 'zustand';

type TodoStore = {
  todoItems: TodoType[];
  hydrateTodoItems: (items: TodoType[]) => void;
  insertTodoItem: (item: TodoType) => void;
  deleteTodoItem: (id: number) => void;
  updateTodoItem: (updated: TodoType) => void;
};

/* ---- 스토어 ---- */

export const useTodoStore = create<TodoStore>((set, get) => ({
  todoItems: [],
  hydrateTodoItems: items => {
    set(s => {
      const map = new Map<number, TodoType>();
      for (const it of s.todoItems) map.set(it.id, it);
      for (const it of items) map.set(it.id, it);
      return { todoItems: Array.from(map.values()) };
    });
  },
  insertTodoItem: item => set({ todoItems: [...get().todoItems, item] }),
  deleteTodoItem: id => set({ todoItems: get().todoItems.filter(item => item.id !== id) }),
  updateTodoItem: updated =>
    set({ todoItems: get().todoItems.map(item => (item.id === updated.id ? updated : item)) }),
}));
