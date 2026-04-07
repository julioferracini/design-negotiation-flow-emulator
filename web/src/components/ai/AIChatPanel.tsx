import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEmulatorConfig } from '../../context/EmulatorConfigContext';
import { usePrototypeNavigate } from '../../context/PrototypeNavigationContext';
import {
  processMessage,
  getGreeting,
  resetWizard,
  nextMessageId,
  type ChatMessage,
  type ConfigAction,
} from './aiWizard';

interface AIChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AIChatPanel({ open, onClose }: AIChatPanelProps) {
  const { palette, mode, setMode, setSegment } = useTheme();
  const config = useEmulatorConfig();
  const navigate = usePrototypeNavigate();
  const isLight = mode === 'light';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const g = getGreeting();
    return [{ id: nextMessageId(), role: 'assistant', text: g.text, quickReplies: g.quickReplies }];
  });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const applyActions = useCallback((actions: ConfigAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'setLocale': config.setLocale(action.value); break;
        case 'setProductLine': config.setProductLine(action.value); break;
        case 'setUseCase': config.setUseCase(action.value); break;
        case 'toggleScreen': config.updateScreen(action.screen, { enabled: action.enabled }); break;
        case 'setFlowOption': config.updateFlowOption(action.key, action.value); break;
        case 'startFlow': config.startFlow(navigate); break;
        case 'setThemeMode': setMode(action.value); break;
        case 'setSegment': setSegment(action.value); break;
      }
    }
  }, [config, navigate, setMode, setSegment]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: nextMessageId(), role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const response = processMessage(text);
      applyActions(response.actions);
      const assistantMsg: ChatMessage = {
        id: nextMessageId(),
        role: 'assistant',
        text: response.text,
        actions: response.actions,
        quickReplies: response.quickReplies,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (response.actions.some((a) => a.type === 'startFlow')) {
        setTimeout(() => onClose(), 600);
      }
    }, 400);
  }, [applyActions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const panelBg = isLight ? '#FFFFFF' : '#111111';
  const headerBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const inputBg = isLight ? '#F5F3F7' : '#1A1A1A';
  const userBubbleBg = palette.accent;
  const assistantBubbleBg = isLight ? '#F5F3F7' : '#1C1C1C';

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [open, onClose]);

  const handleReset = () => {
    resetWizard();
    const g = getGreeting();
    setMessages([{ id: nextMessageId(), role: 'assistant', text: g.text, quickReplies: g.quickReplies }]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 995,
              background: 'rgba(0,0,0,0.25)',
            }}
          />

          <motion.div
            key="ai-panel"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 380,
              zIndex: 996,
              background: panelBg,
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '18px 20px 14px',
              borderBottom: `1px solid ${headerBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}CC)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 12px ${palette.accent}30`,
                }}>
                  <Sparkles size={15} strokeWidth={2} color="#fff" />
                </div>
                <div>
                  <h3 style={{
                    fontSize: 14, fontWeight: 700, color: palette.textPrimary,
                    margin: 0, lineHeight: 1.2, letterSpacing: '-0.1px',
                  }}>
                    AI Assistant
                  </h3>
                  <div style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase',
                    color: palette.accent, marginTop: 2,
                  }}>
                    Skill: Use Case Wizard
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: `1px solid ${headerBorder}`,
                    background: 'transparent', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                    color: palette.textSecondary,
                  }}
                >
                  Reset
                </button>
                <button
                  onClick={onClose}
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: palette.textSecondary,
                  }}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 16px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i === messages.length - 1 ? 0.05 : 0, duration: 0.25 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? userBubbleBg : assistantBubbleBg,
                    color: msg.role === 'user' ? '#fff' : palette.textPrimary,
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}>
                    {msg.text}
                  </div>

                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingLeft: 4,
                    }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: palette.positive,
                      }} />
                      <span style={{
                        fontSize: 10, color: palette.positive, fontWeight: 600,
                        letterSpacing: '0.2px',
                      }}>
                        {msg.actions.length} parameter{msg.actions.length > 1 ? 's' : ''} updated
                      </span>
                    </div>
                  )}

                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8,
                    }}>
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr.label}
                          onClick={() => handleSend(qr.message)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 9999,
                            border: `1px solid ${palette.accent}40`,
                            background: isLight ? `${palette.accent}08` : `${palette.accent}12`,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            color: palette.accent,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLight ? `${palette.accent}15` : `${palette.accent}20`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isLight ? `${palette.accent}08` : `${palette.accent}12`;
                          }}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 16px 16px',
              borderTop: `1px solid ${headerBorder}`,
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: inputBg,
                borderRadius: 12,
                padding: '4px 4px 4px 14px',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 13,
                    color: palette.textPrimary,
                    padding: '8px 0',
                    fontFamily: 'inherit',
                  }}
                />
                <motion.button
                  onClick={() => handleSend(input)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={!input.trim()}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: 'none',
                    background: input.trim() ? palette.accent : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'),
                    cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <Send
                    size={14}
                    strokeWidth={2.2}
                    style={{
                      color: input.trim() ? '#fff' : palette.textSecondary,
                      transition: 'color 0.2s ease',
                    } as React.CSSProperties}
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
