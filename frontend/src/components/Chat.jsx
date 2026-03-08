// Chat Component for AgriGuard AI - Farmer-Friendly Version with Voice Input

import React, { useState, useRef, useEffect } from "react";
import styles from "../styles";
import { API_BASE, DEFAULT_USER_ID } from "../data";

function Chat({ t, messages, setMessages, input, setInput, lang }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : lang === "te" ? "te-IN" : lang === "mr" ? "mr-IN" : "en-US";

        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const transcriptText = result[0].transcript;
          setTranscript(transcriptText);
          
          if (result.isFinal) {
            setInput(transcriptText);
            setIsListening(false);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, [lang, setInput]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice input not supported in this browser. Please try Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Update language before starting
      recognitionRef.current.lang = lang === "hi" ? "hi-IN" : lang === "ta" ? "ta-IN" : lang === "te" ? "te-IN" : lang === "mr" ? "mr-IN" : "en-US";
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript("");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    const current = input.trim();
    setInput("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: current,
          user_id: DEFAULT_USER_ID,
          lang,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: data.response || "..." },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          from: "ai",
          text: "Sorry, I could not reach the server. Please try again.",
        },
      ]);
    }
  };

  return (
    <>
      <h3>{t.chatTitle}</h3>
      
      {/* Messages Area */}
      <div
        style={{
          ...styles.card,
          maxHeight: 350,
          overflowY: "auto",
          padding: 12,
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: m.from === "user" ? "flex-end" : "flex-start",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                background: m.from === "user" ? "#dcfce7" : "#f3f4f6",
                padding: "12px 16px",
                borderRadius: 16,
                maxWidth: "85%",
                fontSize: 15,
                lineHeight: 1.4,
              }}
            >
              {m.from === "ai" && <div style={{ marginBottom: 4 }}>🤖</div>}
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice Status */}
      {isListening && (
        <div
          style={{
            background: "#fee2e2",
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "pulse 1s infinite",
          }}
        >
          <span style={{ fontSize: 24 }}>🎤</span>
          <div>
            <strong>{t.listening}</strong>
<p style={{ margin: "4px 0 0", fontSize: 13, color: "#666" }}>
              {transcript || t.speakNow}
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{ ...styles.card, padding: 12 }}>
        <div
          style={{
            marginBottom: 8,
            fontSize: 12,
            color: "#666",
          }}
        >
          {t.helpline}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chatPlaceholder}
            style={{
              flex: 1,
              borderRadius: 24,
              border: "1px solid #d4d4d4",
              padding: "14px 18px",
              fontSize: 15,
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          
          {/* Voice Button */}
          <button
            onClick={toggleVoice}
            style={{
              ...styles.voiceBtn,
              ...(isListening ? styles.voiceBtnActive : {}),
            }}
            title={isListening ? "Stop" : "Voice input"}
          >
            {isListening ? "⏹" : "🎤"}
          </button>
          
          {/* Send Button */}
          <button
            onClick={handleSend}
            style={{
              borderRadius: "50%",
              border: "none",
              background: "#16a34a",
              color: "white",
              width: 48,
              height: 48,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ➤
          </button>
        </div>
        
        {/* Voice hint */}
        <div
          style={{
            textAlign: "center",
            marginTop: 10,
            fontSize: 12,
            color: "#888",
          }}
        >
          {t.tapToSpeak}
        </div>
      </div>
    </>
  );
}

export default Chat;

