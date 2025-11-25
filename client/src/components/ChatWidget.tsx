import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { trpc } from '../lib/trpc';
import { cn } from '@/lib/utils';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

import { useLocalAuth } from '@/hooks/useLocalAuth';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { user } = useLocalAuth();

    const sendMessageMutation = trpc.chat.sendMessage.useMutation({
        onSuccess: (data) => {
            setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        },
        onError: (error) => {
            console.error('Failed to send message:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
            ]);
        },
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = { role: 'user', content: inputValue };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');

        sendMessageMutation.mutate({
            message: userMessage.content,
            userId: user?.id,
            history: messages.map(m => ({ role: m.role, content: m.content })),
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <div className="w-[90vw] sm:w-[350px] h-[500px] bg-background border rounded-lg shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
                    {/* Header */}
                    <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
                        <h3 className="font-semibold">AI Assistant</h3>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="flex flex-col gap-4">
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm mt-8">
                                    <p>Hi! How can I help you today?</p>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex w-fit max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                                        msg.role === 'user'
                                            ? "ml-auto bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}
                                >
                                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                                        {msg.content}
                                    </p>
                                </div>
                            ))}
                            {sendMessageMutation.isPending && (
                                <div className="bg-muted w-max rounded-lg px-3 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t mt-auto">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={sendMessageMutation.isPending}
                            />
                            <Button size="icon" onClick={handleSend} disabled={sendMessageMutation.isPending || !inputValue.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Button
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={() => setIsOpen(!isOpen)}
            >
                <MessageCircle className="h-6 w-6" />
            </Button>
        </div>
    );
}
