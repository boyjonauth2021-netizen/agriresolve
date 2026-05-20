import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Sprout, Loader2, Bot, User, Mic, MicOff, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Language = "en" | "auto";

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  auto: "Kreol",
};

export default function Assistant() {
  const searchParams = new URLSearchParams(window.location.search);
  const contextPlantId = searchParams.get("plant");

  const { data: conversations = [], isLoading: isLoadingConversations } =
    useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoadingConversations) {
      if (conversations.length > 0) {
        setActiveConvId(conversations[0].id);
      } else {
        createConversation.mutate(
          { data: { title: "Hydroponics Support" } },
          { onSuccess: (conv) => setActiveConvId(conv.id) }
        );
      }
    }
  }, [isLoadingConversations, conversations.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={contextPlantId ? `/plant/${contextPlantId}` : "/"}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-primary font-bold text-lg font-serif">
            <Sprout className="h-5 w-5" />
            AI Green Assistant
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-73px)]">
        {activeConvId ? (
          <ChatWindow
            conversationId={activeConvId}
            initialContext={contextPlantId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        )}
      </main>
    </div>
  );
}

function ChatWindow({
  conversationId,
  initialContext,
}: {
  conversationId: number;
  initialContext: string | null;
}) {
  const { data: convData, isLoading } = useGetOpenaiConversation(conversationId);
  const [localMessages, setLocalMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasSentInitialContext, setHasSentInitialContext] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const { toast } = useToast();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (convData?.messages) {
      setLocalMessages(
        convData.messages.map((m) => ({ role: m.role, content: m.content }))
      );
    }
  }, [convData?.messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, streamingText]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setInputValue("");
    setIsStreaming(true);
    setStreamingText("");

    setLocalMessages((prev) => [...prev, { role: "user", content }]);

    try {
      const response = await fetch(
        `/api/openai/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (!jsonStr) continue;
            try {
              const json = JSON.parse(jsonStr);
              if (json.done) break;
              if (json.content) {
                accumulated += json.content;
                setStreamingText(accumulated);
                scrollToBottom();
              }
            } catch (e) {}
          }
        }
      }

      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: accumulated },
      ]);
      setStreamingText("");
    } catch (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "auto" : "en"));
  };

  const startRecording = useCallback(async () => {
    if (isStreaming || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await transcribeAudio(blob);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access in your browser settings.",
        variant: "destructive",
      });
    }
  }, [isStreaming, isTranscribing, language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (blob: Blob) => {
    if (blob.size < 500) {
      toast({ title: "Recording too short", description: "Hold the microphone button longer while speaking." });
      return;
    }
    setIsTranscribing(true);
    try {
      // Use FileReader for reliable base64 conversion (avoids stack overflow on large buffers)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // result is "data:<mimeType>;base64,<data>" — strip the prefix
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch("/api/openai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          mimeType: blob.type,
          language: language === "en" ? "en" : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Transcription failed");
      }
      if (data.text?.trim()) {
        setInputValue(data.text.trim());
      } else {
        toast({ title: "No speech detected", description: "Please try again and speak clearly." });
      }
    } catch (err: any) {
      toast({
        title: "Could not transcribe",
        description: err?.message || "Please try again or type your message.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    if (
      initialContext &&
      localMessages.length === 0 &&
      !isLoading &&
      !isStreaming &&
      !hasSentInitialContext
    ) {
      setHasSentInitialContext(true);
      setTimeout(() => {
        sendMessage(
          `I'm planning to grow a plant with ID: ${initialContext}. What are the top 3 things I should watch out for as a beginner hydroponic grower?`
        );
      }, 500);
    }
  }, [initialContext, localMessages.length, isLoading, isStreaming, hasSentInitialContext]);

  const micBusy = isStreaming || isTranscribing;

  return (
    <div className="flex flex-col flex-1 bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        {localMessages.length === 0 && !isStreaming && !initialContext && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Sprout className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">Hello, Grower!</p>
            <p className="max-w-sm">
              I'm your AI Green Assistant. Ask me anything about hydroponics,
              plant diseases, nutrients, or system setups. Use the microphone
              to speak in English or Kreol Morisien.
            </p>
          </div>
        )}

        {localMessages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {isStreaming && (
          <ChatMessage role="assistant" content={streamingText} isStreaming />
        )}

        {isStreaming && streamingText === "" && (
          <div className="flex gap-4 max-w-[85%] animate-pulse">
            <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0" />
            <div className="bg-muted p-4 rounded-2xl rounded-tl-sm w-24 h-10" />
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t border-border/50 space-y-2">
        {/* Language toggle */}
        <div className="flex items-center gap-2 justify-end">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            type="button"
            onClick={toggleLanguage}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1"
            data-testid="button-language-toggle"
          >
            <span
              className={cn(
                "px-2 py-0.5 rounded-full transition-colors",
                language === "en"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              English
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full transition-colors",
                language === "auto"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              Kreol
            </span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(inputValue);
          }}
          className="relative flex items-center gap-2"
        >
          {/* Microphone button */}
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={micBusy}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            data-testid="button-microphone"
            className={cn(
              "h-14 w-14 shrink-0 rounded-xl border-border/50 transition-all",
              isRecording && "bg-red-500 border-red-500 text-white scale-105 animate-pulse",
              isTranscribing && "bg-amber-100 border-amber-300 text-amber-700"
            )}
            title={`Hold to speak (${LANGUAGE_LABELS[language]})`}
          >
            {isTranscribing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isRecording
                  ? `Listening in ${LANGUAGE_LABELS[language]}... (release to stop)`
                  : isTranscribing
                  ? "Transcribing..."
                  : `Ask in ${LANGUAGE_LABELS[language]}...`
              }
              className="pr-12 h-14 bg-muted/50 border-border/50 rounded-xl text-base focus-visible:ring-primary/50"
              disabled={isStreaming || isRecording || isTranscribing}
              data-testid="input-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isStreaming}
              data-testid="button-send"
              className="absolute right-2 top-2 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {isRecording && (
          <p className="text-center text-xs text-red-500 font-medium animate-pulse">
            Recording... release the microphone button when done speaking
          </p>
        )}
      </div>
    </div>
  );
}

function ChatMessage({
  role,
  content,
  isStreaming,
}: {
  role: string;
  content: string;
  isStreaming?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div
      className={cn("flex gap-4 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "")}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
          isUser
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "p-4 rounded-2xl shadow-sm max-w-none break-words",
          isUser
            ? "bg-accent/10 text-foreground rounded-tr-sm border border-accent/20"
            : "bg-muted/50 text-foreground rounded-tl-sm border border-border/50",
          isStreaming && "border-primary/50"
        )}
      >
        {isUser ? (
          <span>{content}</span>
        ) : (
          <div className="prose prose-sm prose-neutral max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-foreground [&_p]:leading-relaxed [&_p]:mb-2 [&_ol]:pl-4 [&_ul]:pl-4 [&_li]:mb-1">
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
