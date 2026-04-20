/**
 * FlagIllustration — pixel-perfect port of the NuDS / NuIS (Nubank
 * Illustration System) Flag component, variant `Size=Large, Default=Yes`.
 *
 * Source Figma: https://www.figma.com/design/foz1zDCTETzHv46oGgWsPo
 *   (NuIS – Nubank Illustration System, node 15049:4089)
 * Rosetta Key: nuis_light_flag
 *
 * Composition:
 *   The NuIS Flag is a 64×64 illustration made of 7 vector pieces plus 2
 *   linear-gradient masks that create the highlight falloff on the banner.
 *   We reproduce the exact layout by nesting the 7 SVGs inside a single
 *   parent viewBox of 64×64, each placed via its original Figma inset (%).
 *
 *   Order (back → front), matching Figma Z-order:
 *     1. v1  — banner secondary outline           (#AA68FF)
 *     2. v0  — banner main outline                (#AA68FF)
 *     3. v2  — pole                               (#820AD1)
 *     4. mask0 — banner main highlight w/ grad    (#CEBAF4 ↘ 0)
 *     5. v3  — small accent below banner          (#820AD1 opacity 0.8)
 *     6. mask1 — banner secondary highlight       (#CEBAF4 ↘ 0)
 *     7. v4  — inner fold next to pole            (#AA68FF opacity 0.8)
 *
 *   Every piece is placed at its original natural size — the composition is
 *   1:1 at 64×64 and scales uniformly via react-native-svg's viewBox.
 *
 * Sizing:
 *   Default size is 84 px (matches how the Feedback screen embeds it in
 *   Figma, node 10883:14774). The illustration scales crisply at any size
 *   because it stays fully vectorized.
 */

import React from 'react';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  Stop,
} from 'react-native-svg';

export type FlagIllustrationProps = {
  /** Rendered square size in px. Default 84 (Feedback screen usage). */
  size?: number;
};

/* Brand purples used by the NuIS Flag. */
const PURPLE_01 = '#820AD1';
const PURPLE_02 = '#AA68FF';
const PURPLE_03 = '#CEBAF4';

/*
 * Absolute placement of each piece inside the 64×64 canvas.
 * Values derived from the Figma inset-% on a 64×64 illustration frame:
 *   flag container inset: left 17.19%, right 16.64% → x=11.0016, w=42.3488
 * Each piece's inset is then applied relative to that 42.3488×64 container.
 * See the SVG asset files in assets/feedback/flag-large/ for the source
 * paths — these numbers are the result of that arithmetic.
 */
const POS_V0 = { x: 30.17, y: 0.096 };   /* banner main outline */
const POS_V1 = { x: 11.2853, y: 3.8272 }; /* banner secondary outline */
const POS_V2 = { x: 11.2853, y: 7.9232 }; /* pole */
const POS_V3 = { x: 31.6297, y: 24.0064 }; /* small accent below banner */
const POS_V4 = { x: 11.2811, y: 7.9232 }; /* inner fold */

/* Path data copied verbatim from the downloaded NuDS SVG assets. */
const D_V0 =
  'M22.9035 20.1318C22.9035 20.1318 18.08 29.0118 3.49177 27.36C3.21412 27.3318 2.96 27.2376 2.74353 27.0918C2.64 27.0259 2.54118 26.9553 2.45647 26.8659C2.22588 26.6447 2.05647 26.3576 1.97647 26.0329L1.45882 23.9059C2.29647 23.9529 3.17647 24.0424 4.09882 24.1788L0 7.35529C13.4965 8.30118 18 0 18 0L22.9035 20.1318Z';

const D_V1 =
  'M22.9885 20.453C22.0661 20.3165 21.1861 20.2271 20.3485 20.18C13.9673 19.8177 10.1226 21.9447 7.85909 24.2412C5.43085 26.6977 4.80968 29.3471 4.80968 29.3471L0.0708519 9.89766C-0.0467952 9.40825 -0.0185597 8.8906 0.160264 8.42002C0.527323 7.4459 1.34615 5.73296 2.95556 4.10001C5.36968 1.66237 9.56262 -0.596456 16.7156 0.142368C17.5297 0.227074 18.2026 0.815308 18.4003 1.6106L18.8897 3.62943L22.9885 20.453Z';

const D_V2 =
  'M2.95085 0.00470599L15.9579 53.4024C16.2309 54.5176 15.5485 55.6471 14.4238 55.9247C13.3085 56.1976 12.1744 55.5059 11.9014 54.3906L0.0708519 5.80235C-0.0467952 5.31294 -0.0185597 4.79529 0.160264 4.32C0.527323 3.35059 1.34615 1.63294 2.95085 0V0.00470599Z';

const D_V3 =
  'M2.64 0.272942C2.64 0.272942 2.55059 1.80706 1.28471 3.18588C1.18118 3.12 1.08235 3.04941 0.997648 2.96C0.76706 2.73883 0.59765 2.45176 0.51765 2.12706L0 0C0.837647 0.0470588 1.71765 0.136471 2.64 0.272942Z';

const D_V4 =
  'M2.9529 0C2.34584 0.616471 1.85172 1.24235 1.45172 1.83529C0.792899 2.81882 0.388193 3.71294 0.157605 4.31529C0.0681934 4.55059 0.0164288 4.8 0.00231111 5.04941C0.00231111 5.06823 0.00231111 5.08235 0.00231111 5.10118C-0.00710066 5.33176 0.0117226 5.56706 0.0681932 5.79765L2.27996 14.88L4.80702 25.2471C4.80702 25.2471 5.42819 22.5976 7.85643 20.1412L2.9529 0Z';

export default function FlagIllustration({ size = 84 }: FlagIllustrationProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        {/*
         * Linear gradient used to fade the highlight on the banners from
         * opaque (left, closer to the pole) to transparent (right, outer
         * edge). Applied via Mask below. Coordinates are in the highlight
         * piece's local space.
         */}
        <LinearGradient id="flagGrad0" x1="0" y1="13.7835" x2="22.9035" y2="13.7835" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#000" stopOpacity="1" />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="flagGrad1" x1="0" y1="14.6741" x2="22.9885" y2="14.6741" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#000" stopOpacity="1" />
          <Stop offset="1" stopColor="#000" stopOpacity="0" />
        </LinearGradient>

        {/* Masks applied inside the translated piece groups. */}
        <Mask id="flagMask0" maskUnits="userSpaceOnUse" x="0" y="0" width="22.9035" height="27.5648">
          <Path d={D_V0} fill="url(#flagGrad0)" />
        </Mask>
        <Mask id="flagMask1" maskUnits="userSpaceOnUse" x="0" y="0" width="22.9885" height="29.3471">
          <Path d={D_V1} fill="url(#flagGrad1)" />
        </Mask>
      </Defs>

      {/* 1. banner secondary outline */}
      <G translateX={POS_V1.x} translateY={POS_V1.y}>
        <Path d={D_V1} fill={PURPLE_02} />
      </G>

      {/* 2. banner main outline */}
      <G translateX={POS_V0.x} translateY={POS_V0.y}>
        <Path d={D_V0} fill={PURPLE_02} />
      </G>

      {/* 3. pole */}
      <G translateX={POS_V2.x} translateY={POS_V2.y}>
        <Path d={D_V2} fill={PURPLE_01} />
      </G>

      {/* 4. banner main highlight (masked gradient fade) */}
      <G translateX={POS_V0.x} translateY={POS_V0.y} mask="url(#flagMask0)">
        <Path d={D_V0} fill={PURPLE_03} />
      </G>

      {/* 5. small accent below the banner */}
      <G translateX={POS_V3.x} translateY={POS_V3.y}>
        <Path d={D_V3} fill={PURPLE_01} opacity={0.8} />
      </G>

      {/* 6. banner secondary highlight (masked gradient fade) */}
      <G translateX={POS_V1.x} translateY={POS_V1.y} mask="url(#flagMask1)">
        <Path d={D_V1} fill={PURPLE_03} />
      </G>

      {/* 7. inner fold next to pole */}
      <G translateX={POS_V4.x} translateY={POS_V4.y}>
        <Path d={D_V4} fill={PURPLE_02} opacity={0.8} />
      </G>
    </Svg>
  );
}
