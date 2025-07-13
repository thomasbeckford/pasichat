"use client";

import { DocumentUpload } from "@/components/document-upload";
import { LoadingIcon } from "@/components/icons";
import ProjectOverview from "@/components/project-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, useChat } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { Bot, Brain, Database, Plus, Send, User } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { Options } from "react-markdown";
import { toast } from "sonner";

export default function Chat() {
  const [toolCall, setToolCall] = useState<string>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      maxSteps: 2,
      onToolCall({ toolCall }) {
        setToolCall(toolCall.toolName);
      },
      onError: (error) => {
        console.error("Chat error:", error);
        toast.error(
          "Has alcanzado el límite de velocidad, inténtalo más tarde"
        );
      },
      onFinish: () => {
        setToolCall(undefined);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      },
    });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (messages.length > 0) setIsExpanded(true);
  }, [messages]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const currentToolCall = useMemo(() => {
    const tools = messages?.slice(-1)[0]?.toolInvocations;
    if (tools && toolCall === tools[0].toolName) {
      return tools[0].toolName;
    }
    return undefined;
  }, [toolCall, messages]);

  const conversationHistory = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < messages.length; i += 2) {
      const userMsg = messages[i];
      const assistantMsg = messages[i + 1];
      if (userMsg && userMsg.role === "user") {
        pairs.push({ user: userMsg, assistant: assistantMsg });
      }
    }
    return pairs;
  }, [messages]);

  const lastPair = conversationHistory[conversationHistory.length - 1];

  // Lógica de loading simplificada
  const showLoading =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex justify-center items-start min-h-screen w-full bg-gradient-to-br from-background to-muted/20 px-4 md:px-0 py-4">
      <div className="flex flex-col items-center w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mb-6"
        >
          <ProjectOverview />
        </motion.div>

        {/* Document Upload */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full mb-6"
        >
          <DocumentUpload />
        </motion.div>

        {/* Chat Container */}
        <motion.div
          layout
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="w-full border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Chat Messages */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.3 }}
                  className="border-b"
                >
                  <ScrollArea ref={scrollAreaRef} className="h-96 p-4">
                    <div className="space-y-4">
                      {conversationHistory.map((pair, index) => (
                        <div key={index} className="space-y-3">
                          {/* User Message */}
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div className="flex-1 bg-muted rounded-lg p-3">
                              <p className="text-sm">{pair.user.content}</p>
                            </div>
                          </div>

                          {/* Assistant Message */}
                          {pair.assistant && (
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4 text-secondary-foreground" />
                              </div>
                              <div className="flex-1 bg-background border rounded-lg p-3">
                                <AssistantMessage message={pair.assistant} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Loading State */}
                      {showLoading && lastPair && (
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-secondary-foreground" />
                          </div>
                          <div className="flex-1 bg-background border rounded-lg p-3">
                            <Loading tool={currentToolCall} />
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}

              {/* Input Form */}
              <div className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!input.trim()) return;

                    handleSubmit(e, {
                      body: {
                        fallback:
                          "Lo siento, no tengo información sobre eso en mi base de conocimiento.",
                      },
                    });
                  }}
                  className="flex gap-2"
                >
                  <Input
                    ref={inputRef}
                    className="flex-1 bg-background"
                    placeholder="Pregúntame cualquier cosa..."
                    value={input}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    minLength={2}
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="shrink-0"
                  >
                    {isLoading ? <LoadingIcon /> : <Send />}
                  </Button>
                </form>

                {/* Welcome Message */}
                {!isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center text-muted-foreground"
                  >
                    <div className="space-y-2">
                      <p className="text-sm">
                        ¡Hola! Soy tu asistente inteligente.
                      </p>
                      <p className="text-xs">
                        Puedes subir documentos y hacerme preguntas sobre ellos.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Bar */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-4 flex justify-center"
          >
            <Badge variant="secondary" className="text-xs">
              {messages.length > 0
                ? `${Math.floor(messages.length / 2)} conversaciones`
                : "Listo para chatear"}
            </Badge>
          </motion.div>
        )}
      </div>
    </div>
  );
}

const AssistantMessage = ({ message }: { message: Message | undefined }) => {
  if (!message) return null;

  console.log("Assistant message:", message);

  // Si no hay contenido, mostrar que está procesando
  if (!message.content) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <LoadingIcon />
        <span className="text-sm">Procesando información...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="prose prose-sm max-w-none dark:prose-invert"
    >
      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
    </motion.div>
  );
};

const Loading = ({ tool }: { tool?: string }) => {
  const getToolInfo = (toolName?: string) => {
    switch (toolName) {
      case "getInformation":
        return { text: "Buscando información", icon: Database };
      case "addResource":
        return { text: "Guardando información", icon: Plus };
      case "understandQuery":
        return { text: "Analizando consulta", icon: Brain };
      default:
        return { text: "Pensando", icon: Bot };
    }
  };

  const { text, icon: Icon } = getToolInfo(tool);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <LoadingIcon />
        </motion.div>
        <Icon />
        <span className="text-sm">{text}...</span>
      </div>
    </motion.div>
  );
};

const MemoizedReactMarkdown: React.FC<Options> = React.memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
);
