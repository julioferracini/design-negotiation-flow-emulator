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
        defaultLayout={{ left: 1, right: 1 }}
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
            <div style={{ padding: '24px 32px 16px' }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.3px',
                color: textPrimary,
                margin: 0,
                transition: 'color 0.3s ease',
              }}>
                Hiring / Negotiation Flow
              </h1>
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

        {/* Right Panel — Prototype */}
        <Panel id="right" minSize={30} style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: bgMain,
            transition: 'background 0.3s ease',
          }}>
            <div style={{ padding: '24px 32px 16px', textAlign: 'center' }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.3px',
                color: textPrimary,
                margin: 0,
                transition: 'color 0.3s ease',
              }}>
                Prototype
              </h1>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PrototypeViewport>
                {children}
              </PrototypeViewport>
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
