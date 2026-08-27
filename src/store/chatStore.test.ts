import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';

describe('Chat Store', () => {
  beforeEach(() => {
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
});
