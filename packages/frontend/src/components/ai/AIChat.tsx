'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { sendCommand, getExamples, AICommandResponse, AIServiceError } from '@/lib/ai-client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
  parsedCommand?: AICommandResponse;
}

interface AIChatProps {
  projectId: string;
  onCommandExecuted?: (response: AICommandResponse) => void;
  onClose?: () => void;
}

const SUGGESTED_COMMANDS = [
  'Create a 50mm cube',
  'Make a cylinder radius 10mm, height 30mm',
  'Add a 5mm fillet to all edges',
  'Create a NEMA 23 motor mount',
];

export function AIChat({ projectId, onCommandExecuted, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [examples, setExamples] = useState<string[]>(SUGGESTED_COMMANDS);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load examples on mount
  useEffect(() => {
    getExamples()
      .then((exs) => setExamples(exs.map((ex) => ex.command)))
      .catch(() => {
        // Use default suggested commands
      });
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    // Add user message immediately (optimistic update)
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send command to AI service
      const response = await sendCommand(text, projectId);

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: formatAssistantResponse(response),
        timestamp: new Date(),
        parsedCommand: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Notify parent component
      if (onCommandExecuted) {
        onCommandExecuted(response);
      }

      // Show success toast
      if (response.success) {
        toast.success('Command processed successfully', {
          description: `${response.parsed_command.operation} ${response.parsed_command.geometry}`,
        });
      } else {
        toast.warning('Low confidence', {
          description: response.message || 'Please provide more details',
        });
      }
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: error instanceof AIServiceError
          ? error.message
          : 'Failed to process command. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast.error('AI service error', {
        description: errorMessage.content,
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatAssistantResponse = (response: AICommandResponse): string => {
    const { parsed_command } = response;

    if (!response.success) {
      return `I had trouble understanding that command. ${response.message || 'Could you please rephrase?'}`;
    }

    const params = parsed_command.parameters;
    let description = '';

    switch (parsed_command.geometry) {
      case 'box':
        if (params.width === params.height && params.height === params.depth) {
          description = `Creating a ${params.width}mm cube`;
        } else {
          description = `Creating a box: ${params.width}×${params.height}×${params.depth}mm`;
        }
        break;
      case 'cylinder':
        description = `Creating a cylinder: radius ${params.radius}mm, height ${params.height}mm`;
        break;
      case 'sphere':
        description = `Creating a sphere: radius ${params.radius}mm`;
        break;
      case 'hole':
        description = `Creating a hole: radius ${params.radius}mm, depth ${params.depth}mm`;
        break;
      case 'fillet':
        description = `Adding ${params.radius}mm fillet to selected edges`;
        break;
      case 'chamfer':
        description = `Adding ${params.distance}mm chamfer at ${params.angle}° to selected edges`;
        break;
      case 'extrude':
        description = `Extruding by ${params.distance}mm`;
        break;
      case 'cut':
        description = `Cutting to depth ${params.depth}mm`;
        break;
      default:
        description = `${parsed_command.operation} ${parsed_command.geometry}`;
    }

    if (parsed_command.confidence < 0.7) {
      description += `\n\n⚠️ Confidence: ${(parsed_command.confidence * 100).toFixed(0)}% - Please verify the parameters.`;
    }

    if (parsed_command.suggestions && parsed_command.suggestions.length > 0) {
      description += `\n\n💡 Suggestions:\n${parsed_command.suggestions.map(s => `• ${s}`).join('\n')}`;
    }

    return description;
  };

  const handleRetry = (message: Message) => {
    if (message.role === 'user') {
      handleSendMessage(message.content);
    }
  };

  const handleSuggestedCommand = (command: string) => {
    setInput(command);
    inputRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-gray-700">
      {/* Header with gradient */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-gray-400">Natural language CAD commands</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white mb-1">
                  Ask me to create CAD geometry
                </h4>
                <p className="text-xs text-gray-400 mb-4">
                  Try one of these commands:
                </p>
                <div className="space-y-2">
                  {examples.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedCommand(cmd)}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-gray-300 transition-colors"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                    : message.role === 'error'
                    ? 'bg-red-900/50 border border-red-700 text-red-200'
                    : 'bg-slate-800 text-gray-200'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className="flex items-center justify-between mt-1 gap-2">
                  <div className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {message.role === 'error' && (
                    <button
                      onClick={() => handleRetry(message)}
                      className="text-xs text-red-300 hover:text-red-100 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </button>
                  )}
                </div>
                {message.parsedCommand && message.parsedCommand.parsed_command.confidence < 0.5 && (
                  <div className="mt-2 flex items-start gap-1 text-xs text-yellow-300">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>Low confidence - verify parameters</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Create a 50mm cube..."
            disabled={isLoading}
            className="flex-1 bg-slate-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
