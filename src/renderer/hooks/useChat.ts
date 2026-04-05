import { useCallback } from 'react';
import { useChatStore } from '../store';

export function useChat() {
  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const addMessage = useChatStore((state) => state.addMessage);
  const clearMessages = useChatStore((state) => state.clearMessages);
  const setIsLoading = useChatStore((state) => state.setIsLoading);

  const sendMessage = useCallback(
    async (content: string, agentId: string) => {
      try {
        setIsLoading(true);
        addMessage({
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        });

        const response = await (window as any).oap.agent.run(agentId, content);

        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.result?.finalMessage || 'No response',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, setIsLoading]
  );

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
