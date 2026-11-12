import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';
import { setCurrentUserScope } from '../lib/storage';

describe('Chat Store', () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentUserScope(null);
    useChatStore.getState().clearAllConversations();
  });

  it('should initialize with empty conversations', () => {
    const state = useChatStore.getState();
    expect(state.conversations).toEqual([]);
    expect(state.activeId).toBeNull();
  });

  it('should create a new chat', () => {
    useChatStore.getState().createChat('gemini-1.5');
    const state = useChatStore.getState();
    expect(state.conversations.length).toBe(1);
    expect(state.activeId).not.toBeNull();
    expect(state.conversations[0].id).toBe(state.activeId);
  });

  it('should delete a chat', () => {
    useChatStore.getState().createChat('gemini-1.5');
    let state = useChatStore.getState();
    const id = state.activeId as string;
    
    useChatStore.getState().deleteConversation(id);
    state = useChatStore.getState();
    
    expect(state.conversations.length).toBe(0);
    expect(state.activeId).toBeNull();
  });

  it('should set streaming state', () => {
    useChatStore.getState().setIsStreaming(true);
    expect(useChatStore.getState().isStreaming).toBe(true);
    
    useChatStore.getState().setIsStreaming(false);
    expect(useChatStore.getState().isStreaming).toBe(false);
  });

  it('preserves active non-empty guest conversation when logging in mid-session', () => {
    setCurrentUserScope(null);
    useChatStore.getState().createChat('free_default');
    const convId = useChatStore.getState().activeId!;
    useChatStore.getState().updateConversation(convId, (c) => ({
      ...c,
      messages: [
        ...c.messages,
        {
          id: 'm-guest-1',
          role: 'user',
          content: 'سلام مهمان',
          timestamp: Date.now(),
        },
      ],
    }));

    useChatStore.getState().switchUserContext(42);
    const state = useChatStore.getState();
    expect(state.conversations.some((c) => c.id === convId)).toBe(true);
    expect(state.activeId).toBe(convId);

    // Logging out clears user chats from memory and returns to guest scope
    useChatStore.getState().switchUserContext(null);
    expect(useChatStore.getState().conversations).toEqual([]);
  });
});
