'use client';

import CloseIcon from '@/public/svg/Close.svg';
import { todoApi } from '@/src/api/todo';
import LoadingModal from '@/src/components/common/modal/LoadingModal';
import { useTodoStore } from '@/src/stores/todoStore';
import { FormEvent, useRef, useState } from 'react';

type Props = {
  date: string;
  onClose: () => void;
};

export default function CreateTodoModal({ date, onClose }: Props) {
  const [value, setValue] = useState<string>('');
  const [onLoading, setOnLoading] = useState<boolean>(false);
  const { insertTodoItem } = useTodoStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const isDisabled = value.trim().length === 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isDisabled || onLoading) return;

    try {
      setOnLoading(true);
      const newTodo = await todoApi.create({ content: value, date });
      insertTodoItem(newTodo);
      onClose();
    } catch (error) {
      console.error('Error creating todo:', error);
      alert('할 일 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setOnLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-80 p-6 shadow-md">
        {/* 제목 */}
        <div className="mb-2.5 flex items-start justify-start gap-1">
          <div className="flex-1 flex flex-col items-stretch">
            <h2 className="text-lg font-semibold text-gray-900">새로운 할 일</h2>
            <p className="text-xs text-muted">{date}</p>
          </div>
          <button
            className="w-6 h-6 flex justify-center items-center text-gray-400 hover:text-gray-600"
            type="button"
            onClick={onClose}
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        {/* 입력창 */}
        <div className="mb-2.5">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
            placeholder="할 일을 입력해주세요"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100"
          />
        </div>

        {/* 버튼 */}
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          등록하기
        </button>
      </form>
      <LoadingModal isOpen={onLoading} />
    </>
  );
}
