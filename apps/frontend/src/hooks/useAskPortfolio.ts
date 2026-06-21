import { useCallback, useState } from 'react';
import { useMutation } from 'react-query';
import { askService } from '@/services/askService';
import type { AppError } from '@/errors';
import type { AskRequest, AskResponse } from '@/types/ask';

/**
 * One answer card in the stack — a question paired with its eventual
 * answer (or pending/error state). Newest cards render on top of the
 * stack (see AskPage).
 */
export interface AnswerCardState {
  /** Local id, stable for React keys before the server messageId exists. */
  localId: string;
  question: string;
  status: 'pending' | 'success' | 'error';
  answer?: AskResponse;
  error?: AppError;
}

export interface UseAskPortfolioReturn {
  cards: AnswerCardState[];
  ask: (question: string) => void;
  /** Remove a card from the stack (the card's dismiss action). */
  dismiss: (localId: string) => void;
  isAsking: boolean;
}

let cardCounter = 0;
const nextLocalId = () => `card-${Date.now()}-${cardCounter++}`;

/**
 * Drives the Ask page (Task 12.6). Each `ask()` appends a pending card,
 * fires the mutation, and resolves that card to success/error in place.
 * The thread id from the first answer is reused for subsequent questions
 * so the conversation stays in one thread.
 */
export function useAskPortfolio(): UseAskPortfolioReturn {
  const [cards, setCards] = useState<AnswerCardState[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>(undefined);

  const mutation = useMutation<
    AskResponse,
    AppError,
    { localId: string; request: AskRequest }
  >({
    mutationFn: ({ request }) => askService.ask(request),
    onSuccess: (answer, { localId }) => {
      setThreadId(answer.threadId);
      setCards((prev) =>
        prev.map((c) =>
          c.localId === localId
            ? { ...c, status: 'success', answer }
            : c,
        ),
      );
    },
    onError: (error, { localId }) => {
      setCards((prev) =>
        prev.map((c) =>
          c.localId === localId ? { ...c, status: 'error', error } : c,
        ),
      );
    },
  });

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (trimmed.length === 0) return;
      const localId = nextLocalId();
      // Newest on top.
      setCards((prev) => [
        { localId, question: trimmed, status: 'pending' },
        ...prev,
      ]);
      mutation.mutate({ localId, request: { question: trimmed, threadId } });
    },
    [mutation, threadId],
  );

  const dismiss = useCallback((localId: string) => {
    setCards((prev) => prev.filter((c) => c.localId !== localId));
  }, []);

  return { cards, ask, dismiss, isAsking: mutation.isLoading };
}
