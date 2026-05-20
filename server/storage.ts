import type { Conversation, Message } from "../shared/types.js";

let nextConversationId = 1;
let nextMessageId = 1;

const conversations = new Map<number, Conversation>();
const messages = new Map<number, Message[]>();

export function listConversations(): Conversation[] {
  return Array.from(conversations.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function createConversation(title: string): Conversation {
  const conv: Conversation = {
    id: nextConversationId++,
    title,
    createdAt: new Date().toISOString(),
  };
  conversations.set(conv.id, conv);
  messages.set(conv.id, []);
  return conv;
}

export function getConversation(id: number): Conversation | undefined {
  return conversations.get(id);
}

export function getMessages(conversationId: number): Message[] {
  return messages.get(conversationId) ?? [];
}

export function addMessage(
  conversationId: number,
  role: "user" | "assistant",
  content: string
): Message {
  const msg: Message = {
    id: nextMessageId++,
    conversationId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  const list = messages.get(conversationId) ?? [];
  list.push(msg);
  messages.set(conversationId, list);
  return msg;
}

// Seed default conversation on startup
export function seedDefaultConversation() {
  if (conversations.size === 0) {
    createConversation("Hydroponics Support");
  }
}
