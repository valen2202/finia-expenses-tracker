export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  variant?: 'default' | 'success' | 'error';
}
