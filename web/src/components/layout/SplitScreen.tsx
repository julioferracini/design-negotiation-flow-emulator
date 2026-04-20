/**
 * SplitScreen — Main layout with resizable left/right panels (50/50 default).
 *
 * Left: ParameterPanel (use case configuration)
 * Right: PrototypeViewport (iPhone frame with navigable prototype)
 *
 * Theme-aware: applies palette colors from ThemeContext to entire layout.
 */

import {
  Panel,
  Group,
  Separator,
} from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';
import ParameterPanel from './ParameterPanel';
import PrototypeViewport from './PrototypeViewport';
import { useTheme } from '../../context/ThemeContext';

interface SplitScreenProps {
  children: React.ReactNode;
}

export default function SplitScreen({ children }: SplitScreenProps) {
  const { palette, mode } = useTheme();
  const isLight = mode === 'light';

  const bgMain = isLight ? '#f5f3f7' : palette.background;
  const bgPanel = isLight ? '#f8f7f9' : palette.surface;
  // Right panel uses a subtly deeper tone to suggest the prototype sits one layer below.
  const bgStage = isLight ? '#efebf2' : palette.background;
  const stageInsetShadow = isLight
    ? 'inset 14px 0 22px -18px rgba(31,2,48,0.14)'
    : 'inset 14px 0 22px -18px rgba(0,0,0,0.35)';
  const borderColor = palette.border;
  const textPrimary = palette.textPrimary;
  const gripColor = isLight ? 'rgba(31,2,48,0.25)' : palette.textSecondary;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: bgMain,
      transition: 'background 0.3s ease',
    }}>
      <Group
        orientation="horizontal"
        defaultLayout={{ left: 2, right: 3 }}
        style={{ display: 'flex', height: '100%', width: '100%' }}
      >
        {/* Left Panel — Configuration */}
        <Panel id="left" minSize={25} style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: bgPanel,
            transition: 'background 0.3s ease',
          }}>
            <div style={{ padding: '20px 32px 20px 72px', minHeight: 88, boxSizing: 'border-box' }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                  color: textPrimary,
                  margin: 0,
                  lineHeight: 1.2,
                  transition: 'color 0.3s ease',
                }}
              >
                Emulator
              </h1>
              <p style={{
                fontSize: 12,
                color: isLight ? 'rgba(31,2,48,0.5)' : 'rgba(255,255,255,0.45)',
                margin: '4px 0 0',
                lineHeight: 1.4,
                transition: 'color 0.3s ease',
              }}>
                Use case prototypes with financial and regulatory parameters
              </p>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ParameterPanel />
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        <Separator
          style={{
            width: 1,
            background: borderColor,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'col-resize',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 40,
            borderRadius: 6,
            background: isLight ? '#fff' : palette.surfaceSecondary,
            border: `1px solid ${borderColor}`,
            boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
          }}>
            <GripVertical style={{
              width: 14,
              height: 14,
              color: gripColor,
              transition: 'color 0.3s ease',
            }} />
          </div>
        </Separator>

        {/* Right Panel — Prototype (sidebar + stage handled inside PrototypeViewport) */}
        <Panel id="right" minSize={30} style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: bgStage,
            boxShadow: stageInsetShadow,
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
          }}>
            <PrototypeViewport>
              {children}
            </PrototypeViewport>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
