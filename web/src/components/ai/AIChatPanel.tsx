import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, RotateCcw } from 'lucide-react';
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
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
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
  }, [applyActions, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
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

  const panelBg = isLight ? 'rgba(255,255,255,0.72)' : 'rgba(14,14,14,0.75)';
  const headerBg = isLight ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,20,0.6)';
  const borderSoft = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const inputBg = isLight ? 'rgba(245,243,247,0.8)' : 'rgba(26,26,26,0.8)';
  const userBubbleBg = palette.accent;
  const assistantBubbleBg = isLight ? 'rgba(245,243,247,0.9)' : 'rgba(28,28,28,0.9)';

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
              background: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.35)',
            }}
          />

          <motion.div
            key="ai-panel"
            initial={{ x: 400, opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0.5 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            style={{
              position: 'fixed',
              top: 8,
              right: 8,
              bottom: 8,
              width: 370,
              zIndex: 996,
              background: panelBg,
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              borderRadius: 20,
              border: `1px solid ${borderSoft}`,
              boxShadow: isLight
                ? '0 8px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)'
                : '0 8px 40px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 18px 16px',
              background: headerBg,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: `1px solid ${borderSoft}`,
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent}BB)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 2px 10px ${palette.accent}25`,
                  flexShrink: 0,
                }}>
                  <Sparkles size={17} strokeWidth={2} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: 15, fontWeight: 700, color: palette.textPrimary,
                    margin: 0, lineHeight: 1.2, letterSpacing: '-0.2px',
                  }}>
                    AI Assistant
                  </h3>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase',
                    color: palette.accent, opacity: 0.8,
                  }}>
                    Use Case Wizard
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
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
                    maxWidth: '88%',
                    padding: '11px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? userBubbleBg : assistantBubbleBg,
                    color: msg.role === 'user' ? '#fff' : palette.textPrimary,
                    fontSize: 13,
                    lineHeight: 1.55,
                    fontWeight: 400,
                    border: msg.role === 'user' ? 'none' : `1px solid ${borderSoft}`,
                  }}>
                    {msg.text}
                  </div>

                  {msg.actions && msg.actions.length > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, paddingLeft: 4,
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
                      display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10,
                    }}>
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr.label}
                          onClick={() => handleSend(qr.message)}
                          style={{
                            padding: '7px 14px',
                            borderRadius: 10,
                            border: `1px solid ${palette.accent}30`,
                            background: isLight ? `${palette.accent}06` : `${palette.accent}10`,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            color: palette.accent,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isLight ? `${palette.accent}12` : `${palette.accent}1A`;
                            e.currentTarget.style.borderColor = `${palette.accent}50`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isLight ? `${palette.accent}06` : `${palette.accent}10`;
                            e.currentTarget.style.borderColor = `${palette.accent}30`;
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

            {/* Footer: input + reset */}
            <div style={{
              padding: '10px 14px 14px',
              borderTop: `1px solid ${borderSoft}`,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: inputBg,
                borderRadius: 14,
                padding: '4px 4px 4px 14px',
                border: `1px solid ${borderSoft}`,
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
                    padding: '9px 0',
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
                    borderRadius: 10,
                    border: 'none',
                    background: input.trim() ? palette.accent : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'),
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

              <button
                onClick={handleReset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '6px 0',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  color: palette.textSecondary,
                  opacity: 0.6,
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              >
                <RotateCcw size={11} strokeWidth={2} />
                Reset conversation
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
