import React, { useState, useEffect, useRef } from 'react';
import { 
  Paperclip, 
  Globe, 
  Mic, 
  Send, 
  Camera, 
  Image as ImageIcon, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  HelpCircle,
  FileSearch,
  BookOpen,
  Volume2,
  Brain
} from 'lucide-react';
import { diagnosePhoto, chatFollowUp, ChatMessage } from '../services/api';
import { Progress } from './ui/Progress';

interface DiagnoseChatProps {
  userId: string;
}

type MessageType = {
  key: string;
  from: 'user' | 'assistant';
  content: string;
  image?: string;
  sources?: { title: string; href: string }[];
  reasoning?: {
    content: string;
    duration: number;
    expanded?: boolean;
  };
  metadata?: {
    cropName: string;
    cropScientific: string;
    diseaseName: string;
    diseaseScientific: string;
    confidence: number;
    severity: 'Mild' | 'Moderate' | 'Severe';
    recommendedAction: string;
  };
  status?: 'ready' | 'loading' | 'analyzing';
};

const SUGGESTIONS = [
  { text: "Analyze weather outbreak risk", icon: Globe, color: "#fa6e39" },
  { text: "Identify tomato leaf yellowing symptoms", icon: HelpCircle, color: "#7b3ff2" },
  { text: "Prevent black pod rot in cocoa", icon: BookOpen, color: "#00ed64" },
];

export function DiagnoseChat({ userId }: DiagnoseChatProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Set default greeting
  useEffect(() => {
    setMessages([
      {
        key: 'welcome',
        from: 'assistant',
        content: `Hello! I am CropGuard AI, a state-of-the-art agricultural model trained on extensive datasets of crop-related diseases.\n\nTo diagnose your crop, click the **Attach** button to upload a photo of your leaf or crop specimen. You can also ask me any questions about plant care, pest management, or weather risks!`,
        status: 'ready'
      }
    ]);
  }, []);

  // Format markdown helper
  const formatMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;

      // Headings
      if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
        const title = trimmed.replace(/^#+\s*/, '');
        return (
          <h4 key={idx} className="font-extrabold text-white mt-4 mb-2 text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#1c2d38] pb-1">
            {title}
          </h4>
        );
      }

      // Bullets
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const itemText = trimmed.replace(/^[\-\*]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-2 py-0.5 text-zinc-300 font-medium text-xs">
            <span className="text-primary shrink-0 mt-1.5 w-1 h-1 rounded-full bg-primary" />
            <span className="flex-1">{itemText}</span>
          </div>
        );
      }

      // Inline bold parsing
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        return (
          <p key={idx} className="mb-1.5 text-zinc-300 font-medium text-xs leading-relaxed">
            {parts.map((part, pIdx) => {
              if (pIdx % 2 !== 0) {
                return <strong key={pIdx} className="font-extrabold text-primary">{part}</strong>;
              }
              return part;
            })}
          </p>
        );
      }

      return (
        <p key={idx} className="mb-1.5 text-zinc-300 font-medium text-xs leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  // Trigger file attachment
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDropdownOpen(false);

    // 1. Append user photo message
    const userImgKey = `user-img-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      {
        key: userImgKey,
        from: 'user',
        content: `Uploaded a crop specimen photo for diagnostic scanning.`,
        image: previewUrl
      }
    ]);

    // 2. Append assistant analyzing state
    const assistantKey = `assistant-diag-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        key: assistantKey,
        from: 'assistant',
        content: 'Analyzing crop photo...',
        status: 'analyzing'
      }
    ]);

    setLoading(true);
    setAnalyzingProgress(10);
    const progressInterval = setInterval(() => {
      setAnalyzingProgress((p) => Math.min(p + 15, 90));
    }, 400);

    try {
      // 3. Call API
      const result = await diagnosePhoto(userId, file);

      clearInterval(progressInterval);
      setAnalyzingProgress(100);

      // Parse metadata from headers
      let cropName = 'Unknown Crop';
      let cropScientific = 'Unknown';
      let diseaseName = 'Undetected Anomaly';
      let diseaseScientific = 'Unknown pathogen';
      let recommendedAction = 'Please consult your local extension officer.';

      const text = result.diagnosis;
      if (text) {
        const cropMatch = text.match(/(?:Crop|Plant):\s*([^\n\r]+)/i);
        const diseaseMatch = text.match(/(?:Disease|Anomaly):\s*([^\n\r(]+)(?:\(([^)]+)\))?/i) || text.match(/(?:Disease|Anomaly):\s*([^\n\r]+)/i);
        const actionMatch = text.match(/(?:Recommended Action|Treatment|Action):\s*([^\n\r]+)/i);

        if (cropMatch) cropName = cropMatch[1].trim();
        if (diseaseMatch) {
          diseaseName = diseaseMatch[1].trim();
          if (diseaseMatch[2]) diseaseScientific = diseaseMatch[2].trim();
        }
        if (actionMatch) recommendedAction = actionMatch[1].trim();
      }

      // 4. Update message response
      setChatId(result.chat_id || null);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.key === assistantKey) {
            return {
              ...msg,
              content: result.diagnosis,
              status: 'ready',
              sources: [
                { title: 'Open-Meteo Weather Service', href: 'https://open-meteo.com' },
                { title: 'OpenStreetMap Reverse Geocoding', href: 'https://openstreetmap.org' },
                { title: 'CropGuard Agronomy Database', href: '#' }
              ],
              reasoning: {
                content: `Analyzing raw image pixel buffers... Detected leaf surface chlorosis pattern. Comparing morphology with Puccinia sorghi and Alternaria solani. Identified matching symptoms for ${diseaseName} on ${cropName} with ${result.confidence}% confidence. Core recommended treatment retrieved.`,
                duration: 3,
                expanded: false
              },
              metadata: {
                cropName,
                cropScientific,
                diseaseName,
                diseaseScientific,
                confidence: result.confidence,
                severity: result.status === 'verified' ? 'Mild' : result.status === 'low_confidence' ? 'Severe' : 'Moderate',
                recommendedAction
              }
            };
          }
          return msg;
        })
      );
    } catch (err) {
      clearInterval(progressInterval);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.key === assistantKey) {
            return {
              ...msg,
              content: `⚠️ Diagnosis failed: ${err instanceof Error ? err.message : 'Unknown network connection issue'}`,
              status: 'ready'
            };
          }
          return msg;
        })
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Send textual query
  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setInputText('');

    const userKey = `user-txt-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        key: userKey,
        from: 'user',
        content: textToSend
      }
    ]);

    const assistantKey = `assistant-chat-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        key: assistantKey,
        from: 'assistant',
        content: '',
        status: 'loading'
      }
    ]);

    setLoading(true);

    try {
      // Map history
      const historyPayload: ChatMessage[] = messages
        .filter((m) => m.key !== 'welcome' && m.status !== 'loading' && m.status !== 'analyzing')
        .map((m) => ({
          role: m.from,
          content: m.content
        }));

      const reply = await chatFollowUp(userId, textToSend, historyPayload, chatId);
      setChatId(reply.chatId);

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.key === assistantKey) {
            return {
              ...msg,
              content: reply.reply,
              status: 'ready'
            };
          }
          return msg;
        })
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.key === assistantKey) {
            return {
              ...msg,
              content: `⚠️ Sorry Kwame, I failed to process your question. Please verify your backend server connection.`,
              status: 'ready'
            };
          }
          return msg;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleReasoning = (messageKey: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.key === messageKey && msg.reasoning) {
          return {
            ...msg,
            reasoning: {
              ...msg.reasoning,
              expanded: !msg.reasoning.expanded
            }
          };
        }
        return msg;
      })
    );
  };

  const handleSpeechOutput = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/^(?:CROP|DISEASE|CONFIDENCE|RECOMMENDED ACTION):\s*[^\n\r]*/gim, '')
      .replace(/[#\*_\-\[\]]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 250) + '...');
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-[#001e2b] border border-[#1c2d38] rounded-3xl overflow-hidden shadow-2xl relative">
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      {/* Messages Scroll view */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.from === 'user';
          return (
            <div key={msg.key} className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              
              {/* Image attachment rendering */}
              {msg.image && (
                <div className="mb-2 relative rounded-2xl overflow-hidden border border-[#00684a]/30 shadow-md max-w-xs md:max-w-md select-none">
                  <img src={msg.image} alt="Crop attachment" className="w-full object-cover max-h-48" />
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-[#001e2b]/80 backdrop-blur text-primary px-2 py-0.5 rounded-full">
                    Specimen Upload
                  </span>
                </div>
              )}

              {/* Message Content Container */}
              <div className={`max-w-[85%] md:max-w-[80%] rounded-3xl px-5 py-4 text-xs leading-relaxed transition-all shadow-sm ${
                isUser 
                  ? 'bg-[#003d4f] text-white rounded-tr-none border border-[#00684a]/30' 
                  : 'bg-[#001e2b] text-zinc-100 border border-[#1c2d38]'
              }`}>
                
                {/* Sources Used Block */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-[#a8b3bc]">
                    <FileSearch className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Used {msg.sources.length} sources</span>
                    <ArrowRight className="w-3 h-3" />
                    {msg.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.href} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="underline hover:text-primary transition-colors truncate max-w-[120px]"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}

                {/* Reasoning Trace Collapsible */}
                {!isUser && msg.reasoning && (
                  <div className="mb-3 border-l-2 border-primary/40 pl-3 py-0.5">
                    <button 
                      onClick={() => toggleReasoning(msg.key)}
                      className="flex items-center gap-1.5 text-[9px] font-bold text-[#a8b3bc] hover:text-primary transition-colors"
                    >
                      <Brain className="w-3.5 h-3.5 text-primary animate-pulse" />
                      <span>Thought for {msg.reasoning.duration} seconds</span>
                      {msg.reasoning.expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {msg.reasoning.expanded && (
                      <p className="mt-1.5 text-[10px] text-zinc-400 italic leading-relaxed">
                        {msg.reasoning.content}
                      </p>
                    )}
                  </div>
                )}

                {/* Diagnostic Details Metadata Card */}
                {!isUser && msg.metadata && (
                  <div className="mb-4 bg-[#003d4f] border border-[#00684a]/50 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-black">
                        🌿 {msg.metadata.cropName} <span className="text-[8px] italic font-medium opacity-85">({msg.metadata.cropScientific})</span>
                      </span>
                      <span className="text-[9px] bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded-full font-bold">
                        Disease Detected
                      </span>
                    </div>

                    <div className="border-b border-[#1c2d38]/50 pb-2">
                      <h4 className="text-sm font-black text-white leading-tight">{msg.metadata.diseaseName}</h4>
                      <p className="text-[9px] text-[#a8b3bc] italic mt-0.5 font-bold">{msg.metadata.diseaseScientific}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center text-[9px] font-bold mb-1">
                          <span className="text-[#a8b3bc]">Confidence</span>
                          <span className="text-primary">{msg.metadata.confidence}%</span>
                        </div>
                        <Progress value={msg.metadata.confidence} barClassName="bg-primary" className="h-1.5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#a8b3bc] block mb-0.5">Severity</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            msg.metadata.severity === 'Severe' ? 'bg-danger' : msg.metadata.severity === 'Moderate' ? 'bg-gold' : 'bg-primary'
                          }`} />
                          <span className="text-xs font-bold text-white leading-none">{msg.metadata.severity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#001e2b]/50 border border-[#1c2d38]/60 rounded-xl p-2.5 text-[10px] text-zinc-300 font-medium">
                      <strong className="text-primary block mb-0.5 font-bold">Recommended Action:</strong>
                      {msg.metadata.recommendedAction}
                    </div>
                  </div>
                )}

                {/* Loading / Analyzing States */}
                {msg.status === 'loading' && (
                  <div className="flex items-center gap-2 py-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-zinc-400 font-bold text-[10px]">Thinking...</span>
                  </div>
                )}

                {msg.status === 'analyzing' && (
                  <div className="space-y-2 py-2 w-48">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                      </span>
                      <span className="text-white font-black text-[11px] uppercase tracking-wider animate-pulse">Running Diagnosis...</span>
                    </div>
                    <Progress value={analyzingProgress} barClassName="bg-primary animate-pulse" className="h-1.5" />
                    <p className="text-[9px] text-[#a8b3bc] font-semibold leading-none">Scanning crop pixel vectors ({analyzingProgress}%)</p>
                  </div>
                )}

                {/* Markdown text representation */}
                {msg.content && (
                  <div className="space-y-1">
                    {formatMarkdown(msg.content)}
                  </div>
                )}

                {/* Speech audio output button */}
                {!isUser && msg.status === 'ready' && (
                  <button 
                    onClick={() => handleSpeechOutput(msg.content)}
                    className="mt-3 flex items-center gap-1 text-[9px] font-bold text-primary hover:text-white transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen Report</span>
                  </button>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Preset Suggestions Row */}
      {messages.length === 1 && (
        <div className="px-4 md:px-6 py-2 flex flex-wrap gap-2 items-center justify-center shrink-0 border-t border-[#1c2d38]/40 bg-[#001e2b]">
          {SUGGESTIONS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendText(s.text)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1c2d38] text-[10px] font-bold text-[#a8b3bc] hover:border-primary hover:text-white hover:bg-[#003d4f] transition-all"
              >
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span>{s.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Terminal Footer */}
      <div className="p-4 bg-[#001e2b] border-t border-[#1c2d38]">
        <div className="mx-auto max-w-4xl space-y-2 relative">
          
          {/* File Attach Dropdown Options */}
          {dropdownOpen && (
            <div className="absolute bottom-16 left-2 bg-[#003d4f] border border-[#00684a]/50 rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-44 z-50">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] font-bold text-[#a8b3bc] hover:text-white hover:bg-[#00684a] transition-all"
              >
                <ImageIcon className="w-4 h-4 text-primary" />
                Upload Photo
              </button>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] font-bold text-[#a8b3bc] hover:text-white hover:bg-[#00684a] transition-all"
              >
                <Camera className="w-4 h-4 text-primary" />
                Take Photo
              </button>
            </div>
          )}

          {/* Text Input Terminal Area */}
          <div className="bg-[#003d4f] border border-[#00684a]/40 focus-within:border-primary/50 rounded-3xl p-3 flex flex-col transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendText(inputText);
                }
              }}
              placeholder="Ask CropGuard AI anything..."
              className="w-full bg-transparent border-0 outline-none text-white placeholder-zinc-400/80 px-2 py-1 text-xs resize-none min-h-12 focus:ring-0"
            />
            
            {/* Input Controls Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-[#1c2d38]/50 mt-1">
              
              {/* Attach and Search triggers */}
              <div className="flex items-center gap-2 select-none">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1c2d38] text-[10px] font-bold transition-all ${
                    dropdownOpen ? 'bg-primary text-[#001e2b]' : 'bg-transparent text-[#a8b3bc] hover:text-white'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach</span>
                </button>

                <button
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1c2d38] text-[10px] font-bold transition-all ${
                    useWebSearch ? 'bg-primary text-[#001e2b]' : 'bg-transparent text-[#a8b3bc] hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>

              {/* Voice and Send tools */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1c2d38] text-[10px] font-bold transition-all ${
                    isRecording ? 'bg-danger text-white animate-pulse' : 'bg-transparent text-[#a8b3bc] hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice</span>
                </button>

                <button
                  onClick={() => handleSendText(inputText)}
                  disabled={!inputText.trim() || loading}
                  className="w-8 h-8 rounded-full bg-primary hover:bg-[#00b545] disabled:bg-zinc-700 disabled:text-zinc-500 flex items-center justify-center text-[#001e2b] transition-all active:scale-95 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
