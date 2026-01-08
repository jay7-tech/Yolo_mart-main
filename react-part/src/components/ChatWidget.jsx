import React, { useEffect, useRef, useState } from 'react';

export default function ChatWidget({ apiBase = 'http://localhost:3002' }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]); // {role:'user'|'assistant', text}
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    const p = localStorage.getItem('phone') || '';
    setPhone(p);
    sessionIdRef.current = `session_${p || 'anon'}_${Date.now()}`;
  }, []);

  useEffect(() => {
    // scroll to bottom when chat changes
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat, loading]);

  const openWidget = () => setOpen(true);
  const closeWidget = () => setOpen(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const txt = message.trim();
    setChat((c) => [...c, { role: 'user', text: txt }]);
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: txt, sessionId: sessionIdRef.current }),
      });
      const data = await res.json();
      if (data.success) {
        setChat((c) => [...c, { role: 'assistant', text: data.reply }]);
      } else {
        setChat((c) => [...c, { role: 'assistant', text: `Error: ${data.message || 'no response'}` }]);
      }
    } catch (err) {
      setChat((c) => [...c, { role: 'assistant', text: 'Network or server error.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setChat([]);
    sessionIdRef.current = `session_${phone || 'anon'}_${Date.now()}`;
  };

  return (
    <>
      {/* BIG centered floating button (moved away from bottom-right camera) */}
      <div className="fixed bottom-5 left-2 z-40 pointer-events-auto">
        <button
          id="chat-toggle"
          onClick={() => (open ? closeWidget() : openWidget())}
          aria-label="Open chat"
          className="w-20 h-20 md:w-18 md:h-18 rounded-full shadow-2xl bg-gradient-to-br from-indigo-600 to-pink-500 text-white flex items-center justify-center hover:scale-105 transform transition-all duration-200"
        >
          {/* larger chat icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 md:w-14 md:h-14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a9 9 0 01-4-.9L3 21l1.9-5.1A7.002 7.002 0 013 12c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
          </svg>
        </button>
      </div>

      {/* Modal / Panel (unchanged size but can be adjusted) */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={closeWidget} />

          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">Y</div>
                <div>
                  <div className="text-sm font-semibold">Yolomart Assistant</div>
                  <div className="text-xs text-gray-500">Personalized using your preferences</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={newChat} className="text-xs px-3 py-1 rounded bg-gray-100">New</button>
                <button onClick={closeWidget} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>
            </div>

            {/* Chat area */}
            <div className="p-3 h-96 overflow-y-auto" ref={chatRef}>
              {chat.length === 0 && (
                <div className="text-center text-gray-500 text-sm mt-8">Ask me about products, recipes, or recommendations.</div>
              )}

              {chat.map((m, i) => (
                <div key={i} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && <div className="text-left text-sm text-gray-500">Thinking...</div>}
            </div>

            {/* Input area */}
            <div className="px-3 py-3 border-t bg-gray-50">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Ask about products, recipes, or request recommendations..."
                className="w-full p-3 border rounded resize-none focus:outline-none focus:ring"
              />

              <div className="flex items-center gap-2 mt-2">
                <button onClick={sendMessage} disabled={loading || !message.trim()} className="flex-1 bg-indigo-600 text-white py-3 rounded">Send</button>
                <div className="text-xs text-gray-500">Signed in: {phone || 'guest'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
