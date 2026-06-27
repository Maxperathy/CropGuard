import { useState, useEffect, useRef } from 'react';
import { DiagnosisResult, chatFollowUp, ChatMessage } from '../services/api';
import { ChatBubble } from './ui/ChatBubble';
import { Send } from 'lucide-react';

interface Props {
  result: DiagnosisResult | null;
}

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'How do I treat it?',
  'Can it spread?',
  'Nearest agro shop',
  'Can I harvest?',
  'How much fungicide?',
];

export function DiagnosisResultPanel({ result }: Props) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Default welcome message when a diagnosis is loaded
  useEffect(() => {
    if (result) {
      setChatHistory([
        {
          role: 'assistant',
          content: `Hello! I've analyzed the crop photo. The diagnosis indicates ${result.diagnosis.split('.')[0]}. How can I help you treat this today?`,
        }
      ]);
      setChatId(result.chat_id || null);
    } else {
      // Default placeholder chat history matching the screenshot
      setChatHistory([
        {
          role: 'user',
          content: 'Can this spread to other crops?',
        },
        {
          role: 'assistant',
          content: 'Yes. Leaf rust can spread to other cereals like sorghum and wheat through airborne spores, especially in humid and windy conditions.',
        }
      ]);
    }
  }, [result]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  async function handleSend(textToSend: string) {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatHistoryItem = {
      role: 'user',
      content: textToSend,
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const apiHistory: ChatMessage[] = chatHistory.map((h) => ({
        role: h.role,
        content: h.content,
      }));

      // Fallback user ID if result is null for demo purposes
      const userId = result ? result.user_id : 'demo-user-id';

      const response = await chatFollowUp(
        userId,
        textToSend,
        apiHistory,
        chatId
      );

      setChatId(response.chatId);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
        },
      ]);
    } catch (err) {
      console.error('Follow-up chat failed:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I failed to process your question. Please check backend connection and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 flex flex-col justify-between h-96 relative">
      <div>
        <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider mb-1">Ask CropGuard AI</h4>
        <p className="text-[10px] text-zinc-400 font-semibold mb-3">Ask me anything about this diagnosis...</p>
      </div>

      {/* Chat History Messages Scrollbar */}
      <div 
        ref={chatHistoryRef}
        className="flex-1 overflow-y-auto mb-3 pr-1 space-y-2 max-h-[170px]"
        style={{ scrollbarWidth: 'none' }}
      >
        {chatHistory.map((msg, idx) => {
          return (
            <ChatBubble 
              key={idx} 
              role={msg.role}
            >
              {msg.content}
            </ChatBubble>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-50 border border-zinc-150 rounded-2xl rounded-tl-none p-4 max-w-xs w-full animate-pulse space-y-2">
              <div className="h-3 bg-zinc-200 rounded w-1/3" />
              <div className="h-2 bg-zinc-150 rounded w-5/6" />
              <div className="h-2 bg-zinc-100/60 rounded w-2/3" />
            </div>
          </div>
        )}
      </div>

      {/* Inputs and Suggestion chips */}
      <div className="shrink-0">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(chatInput);
            setChatInput('');
          }}
          className="flex items-center gap-2 border border-zinc-200 bg-zinc-50/50 rounded-2xl p-1.5 focus-within:border-primary focus-within:bg-white transition-all mb-3"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={loading}
            placeholder="Ask me anything about this diagnosis..."
            className="flex-1 text-xs font-semibold text-zinc-800 bg-transparent outline-none border-none py-1 placeholder-zinc-400 pl-2"
          />

          <button
            type="submit"
            disabled={!chatInput.trim() || loading}
            className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-light disabled:bg-zinc-100 disabled:text-zinc-300 transition-all shrink-0 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 hover:border-primary/45 rounded-full text-[9px] font-bold text-zinc-500 hover:text-zinc-800 transition-all shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
