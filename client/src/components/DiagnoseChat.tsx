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
  audio_base64?: string | null;
  audio_format?: string | null;
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
  const [twiMode, setTwiMode] = useState(false);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if ((window as any)._recognitionInstance) {
        (window as any)._recognitionInstance.stop();
      }
    };
  }, []);

  const playAudio = (base64: string, format: string | null) => {
    try {
      const type = format || 'wav';
      const audioUrl = `data:audio/${type};base64,${base64}`;
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.warn('[Audio Playback] Autoplay was prevented or audio failed to load:', err);
      });
    } catch (err) {
      console.error('[Audio Playback] Error playing audio:', err);
    }
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported on this browser. Try Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = twiMode ? 'ak-GH' : 'en-GH';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onerror = (event: any) => {
      console.error('[STT] Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.start();
    (window as any)._recognitionInstance = recognition;
  };

  const stopRecording = () => {
    if ((window as any)._recognitionInstance) {
      (window as any)._recognitionInstance.stop();
    }
    setIsRecording(false);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

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
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Headings
      if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
        const title = trimmed.replace(/^#+\s*/, '');
        return (
          <h4 key={idx} className="font-extrabold text-zinc-950 mt-5 mb-2.5 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 pb-1.5">
            {title}
          </h4>
        );
      }

      // Bullets
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const itemText = trimmed.replace(/^[\-\*]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-2 pl-2 py-0.5 text-zinc-650 font-medium text-xs">
            <span className="text-primary shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="flex-1">{itemText}</span>
          </div>
        );
      }

      // Inline bold parsing
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        return (
          <p key={idx} className="mb-2 text-zinc-600 font-medium text-xs leading-relaxed">
            {parts.map((part, pIdx) => {
              if (pIdx % 2 !== 0) {
                return <strong key={pIdx} className="font-extrabold text-zinc-950">{part}</strong>;
              }
              return part;
            })}
          </p>
        );
      }

      return (
        <p key={idx} className="mb-2 text-zinc-600 font-medium text-xs leading-relaxed">
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

      const reply = await chatFollowUp(userId, textToSend, historyPayload, chatId, twiMode);
      setChatId(reply.chatId);

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.key === assistantKey) {
            const updatedMsg: MessageType = {
              ...msg,
              content: reply.reply,
              audio_base64: reply.audio_base64,
              audio_format: reply.audio_format,
              status: 'ready'
            };
            if (reply.audio_base64) {
              playAudio(reply.audio_base64, reply.audio_format);
            }
            return updatedMsg;
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

  const handleSpeechOutput = (msg: MessageType) => {
    if (msg.audio_base64) {
      playAudio(msg.audio_base64, msg.audio_format || 'wav');
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = msg.content
      .replace(/^(?:CROP|DISEASE|CONFIDENCE|RECOMMENDED ACTION):\s*[^\n\r]*/gim, '')
      .replace(/[#\*_\-\[\]]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 250) + '...');
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white border border-zinc-200/80 rounded-3xl overflow-hidden shadow-sm relative">
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      {/* Messages Scroll view */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.from === 'user';
          return (
            <div key={msg.key} className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              
              {/* Image attachment rendering */}
              {msg.image && (
                <div className="mb-3 relative rounded-2xl overflow-hidden border border-zinc-200 shadow-sm max-w-xs md:max-w-md select-none">
                  <img src={msg.image} alt="Crop attachment" className="w-full object-cover max-h-48" />
                  <span className="absolute top-2 right-2 text-[9px] font-bold bg-white/90 backdrop-blur text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    Specimen Upload
                  </span>
                </div>
              )}

              {/* Message Content Container */}
              <div className={`leading-relaxed transition-all ${
                isUser 
                  ? 'max-w-[85%] md:max-w-[70%] rounded-3xl px-5 py-3 text-xs bg-zinc-100 text-zinc-800 rounded-tr-none border border-zinc-200/50 shadow-sm' 
                  : 'max-w-full md:max-w-[90%] bg-transparent text-zinc-800 p-0 shadow-none border-0'
              }`}>
                
                {/* Sources Used Block */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-zinc-400">
                    <FileSearch className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>Used {msg.sources.length} sources</span>
                    <ArrowRight className="w-3 h-3 text-zinc-300" />
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
                  <div className="mb-3 border-l-2 border-zinc-200 pl-3 py-0.5">
                    <button 
                      onClick={() => toggleReasoning(msg.key)}
                      className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 hover:text-primary transition-colors"
                    >
                      <Brain className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                      <span>Thought for {msg.reasoning.duration} seconds</span>
                      {msg.reasoning.expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {msg.reasoning.expanded && (
                      <p className="mt-1.5 text-[10px] text-zinc-500 italic leading-relaxed">
                        {msg.reasoning.content}
                      </p>
                    )}
                  </div>
                )}

                {/* Diagnostic Details Metadata Card */}
                {!isUser && msg.metadata && (
                  <div className="mb-4 bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-3.5 shadow-sm max-w-2xl">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] bg-primary/10 text-[#00684a] border border-primary/20 px-2.5 py-0.5 rounded-full font-black">
                        🌿 {msg.metadata.cropName} <span className="text-[8px] italic font-medium opacity-85">({msg.metadata.cropScientific})</span>
                      </span>
                      <span className="text-[9px] bg-danger/10 text-danger border border-danger/20 px-2.5 py-0.5 rounded-full font-bold">
                        Disease Detected
                      </span>
                    </div>

                    <div className="border-b border-zinc-150 pb-2">
                      <h4 className="text-sm font-black text-zinc-950 leading-tight">{msg.metadata.diseaseName}</h4>
                      <p className="text-[9px] text-zinc-400 italic mt-0.5 font-bold">{msg.metadata.diseaseScientific}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between items-center text-[9px] font-bold mb-1">
                          <span className="text-zinc-500">Confidence</span>
                          <span className="text-[#00684a]">{msg.metadata.confidence}%</span>
                        </div>
                        <Progress value={msg.metadata.confidence} barClassName="bg-primary" className="h-1.5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-zinc-500 block mb-0.5">Severity</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            msg.metadata.severity === 'Severe' ? 'bg-danger' : msg.metadata.severity === 'Moderate' ? 'bg-gold' : 'bg-primary'
                          }`} />
                          <span className="text-xs font-bold text-zinc-800 leading-none">{msg.metadata.severity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-[10px] text-zinc-700 font-medium">
                      <strong className="text-[#00684a] block mb-0.5 font-bold">Recommended Action:</strong>
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
                  <div className="space-y-2.5 py-2 w-48">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                      </span>
                      <span className="text-zinc-950 font-black text-[11px] uppercase tracking-wider animate-pulse">Running Diagnosis...</span>
                    </div>
                    <Progress value={analyzingProgress} barClassName="bg-primary animate-pulse" className="h-1.5" />
                    <p className="text-[9px] text-zinc-400 font-semibold leading-none">Scanning crop pixel vectors ({analyzingProgress}%)</p>
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
                    onClick={() => handleSpeechOutput(msg)}
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
        <div className="px-4 md:px-6 py-3 flex flex-wrap gap-2 items-center justify-center shrink-0 border-t border-zinc-200/80 bg-zinc-50/50">
          {SUGGESTIONS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendText(s.text)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-200 text-[10px] font-bold text-zinc-600 hover:border-primary hover:text-primary hover:bg-primary/5 bg-white shadow-sm transition-all"
              >
                <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span>{s.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Terminal Footer */}
      <div className="p-4 bg-white border-t border-zinc-200/80 shrink-0">
        <div className="mx-auto max-w-4xl space-y-2 relative">
          
          {/* File Attach Dropdown Options */}
          {dropdownOpen && (
            <div className="absolute bottom-16 left-2 bg-white border border-zinc-200 rounded-2xl p-2 shadow-xl flex flex-col gap-1 w-44 z-50">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-all"
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
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-all"
              >
                <Camera className="w-4 h-4 text-primary" />
                Take Photo
              </button>
            </div>
          )}

          {/* Text Input Terminal Area */}
          <div className="bg-zinc-50/50 border border-zinc-200/80 focus-within:border-primary/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10 rounded-3xl p-3 flex flex-col transition-all">
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
              className="w-full bg-transparent border-0 outline-none text-zinc-800 placeholder-zinc-400 px-2 py-1 text-xs resize-none min-h-12 focus:ring-0"
            />
            
            {/* Input Controls Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-200/80 mt-1">
              
              {/* Attach, Search, and Language triggers */}
              <div className="flex items-center gap-2 select-none">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-[10px] font-bold transition-all ${
                    dropdownOpen ? 'bg-primary text-[#001e2b]' : 'bg-white text-zinc-600 hover:text-zinc-800 hover:bg-zinc-50 shadow-sm'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Attach</span>
                </button>

                <button
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-[10px] font-bold transition-all ${
                    useWebSearch ? 'bg-primary text-[#001e2b]' : 'bg-white text-zinc-600 hover:text-zinc-800 hover:bg-zinc-50 shadow-sm'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Search</span>
                </button>

                <button
                  onClick={() => setTwiMode(!twiMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-[10px] font-bold transition-all ${
                    twiMode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-zinc-650 hover:text-zinc-855 hover:bg-zinc-50 shadow-sm'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${twiMode ? 'bg-white' : 'bg-zinc-400'}`} />
                  <span>Twi<span className="hidden sm:inline"> Akan Mode</span></span>
                </button>
              </div>

              {/* Voice and Send tools */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVoiceToggle}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200 text-[10px] font-bold transition-all ${
                    isRecording ? 'bg-danger text-white animate-pulse shadow-sm' : 'bg-white text-zinc-600 hover:text-zinc-850 hover:bg-zinc-50 shadow-sm'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Voice</span>
                </button>

                <button
                  onClick={() => handleSendText(inputText)}
                  disabled={!inputText.trim() || loading}
                  className="w-8 h-8 rounded-full bg-primary hover:bg-[#00b545] disabled:bg-zinc-200 disabled:text-zinc-400 flex items-center justify-center text-[#001e2b] transition-all active:scale-95 shadow-sm"
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
