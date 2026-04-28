'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
    role: 'user' | 'coach'
    content: string
}

export function AICoachChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'coach', content: "Hi! I'm Coach Stride. I'm here to help you crush your training goals. How are you feeling today?" }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsLoading(true)

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history: messages })
            })

            const data = await response.json()
            if (data.reply) {
                setMessages(prev => [...prev, { role: 'coach', content: data.reply }])
            } else {
                setMessages(prev => [...prev, { role: 'coach', content: "Sorry, I'm having trouble connecting right now." }])
            }
        } catch (_error) {
            setMessages(prev => [...prev, { role: 'coach', content: "Sorry, an error occurred." }])
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 w-14 h-14 bg-gray-900 dark:bg-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
                aria-label="Open AI Coach"
            >
                <span className="text-2xl">🤖</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-[#121212]"></span>
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-[#121212] sm:inset-auto sm:bottom-24 sm:right-4 sm:w-[400px] sm:h-[600px] sm:rounded-2xl sm:shadow-2xl sm:border border-gray-200 dark:border-zinc-800 absolute overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-[#1E1E1E] p-4 flex items-center justify-between border-b dark:border-zinc-800 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-xl">
                        🤖
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Coach Stride</h3>
                        <p className="text-xs text-green-600 dark:text-green-500 font-medium">● Online</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                            msg.role === 'user' 
                                ? 'bg-[#FF6B35] text-white rounded-br-none' 
                                : 'bg-white dark:bg-[#1E1E1E] border dark:border-zinc-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                        }`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-[#1E1E1E] border dark:border-zinc-800 rounded-2xl px-4 py-3 rounded-bl-none shadow-sm flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#1E1E1E] border-t dark:border-zinc-800 z-10">
                <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#121212] rounded-xl p-2 border dark:border-zinc-800 focus-within:border-[#FF6B35] dark:focus-within:border-[#FF6B35] transition-colors shadow-inner">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Ask Coach Stride..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 text-sm p-2 outline-none dark:text-white"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 rounded-lg bg-[#FF6B35] text-white flex items-center justify-center disabled:opacity-50 transition-opacity flex-shrink-0"
                    >
                        <svg className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
