export interface Message {
  id: string;
  from: string;
  trigger: string;
  showAfter: string;
  text: string;
  gift?: { balls?: number };
}

export async function fetchMessages(): Promise<Message[]> {
  try {
    const res = await fetch('/data/messages.json');
    if (!res.ok) return [];
    return await res.json() as Message[];
  } catch {
    return [];
  }
}

export function filterNewMessages(messages: Message[], seenIds: string[]): Message[] {
  return messages.filter(m => !seenIds.includes(m.id));
}
