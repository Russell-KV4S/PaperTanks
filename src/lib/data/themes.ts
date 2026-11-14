import type { DecalStyle, ThemeId } from '../engine/types';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  tagline: string;
  supporterOnly: boolean;
  paperBg: string;
  paperEdgeShadow: string;
  gridStyle: 'ruled' | 'graph' | 'neon_grid' | 'crt';
  ruleLineColor: string;
  ruleSubLineColor?: string;
  marginLineColor: string;
  holePunchColor: string;
  holePunchRing: string;
  foldHighlight: string;
  foldShadow: string;
  p1Ink: string;
  p1InkLight: string;
  p2Ink: string;
  p2InkLight: string;
  graphiteColor: string;
  doodleInk: string;
  coffeeRingColor: string;
  eraserFill: string;
  eraserAccent: string;
  pencilWood: string;
  pencilPaint: string;
  pencilEraser: string;
  pencilFerrule: string;
  hudText: string;
  hudAccent: string;
  cardBg: string;
  cardBorder: string;
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  classic: {
    id: 'classic',
    name: 'Wide-Ruled Notebook',
    tagline: 'Bic ink & #2 pencil on spiral paper',
    supporterOnly: false,
    paperBg: '#faf6eb',
    paperEdgeShadow: 'rgba(90, 74, 48, 0.14)',
    gridStyle: 'ruled',
    ruleLineColor: 'rgba(130, 178, 224, 0.52)',
    marginLineColor: 'rgba(219, 86, 98, 0.65)',
    holePunchColor: '#e2dccb',
    holePunchRing: 'rgba(120, 108, 86, 0.35)',
    foldHighlight: 'rgba(255, 255, 255, 0.72)',
    foldShadow: 'rgba(72, 58, 38, 0.18)',
    p1Ink: '#1442a8',
    p1InkLight: 'rgba(20, 66, 168, 0.22)',
    p2Ink: '#c92a2a',
    p2InkLight: 'rgba(201, 42, 42, 0.22)',
    graphiteColor: '#2d3035',
    doodleInk: '#363b42',
    coffeeRingColor: 'rgba(134, 86, 44, 0.32)',
    eraserFill: '#f29ca3',
    eraserAccent: '#d96b75',
    pencilWood: '#e7c391',
    pencilPaint: '#f4c430',
    pencilEraser: '#ef7b86',
    pencilFerrule: '#c8cdd4',
    hudText: '#1c2430',
    hudAccent: '#c92a2a',
    cardBg: '#fffdf7',
    cardBorder: '#1442a8'
  },
  graph: {
    id: 'graph',
    name: 'Engineering Graph Paper',
    tagline: '5mm drafting grid & mechanical lead',
    supporterOnly: false,
    paperBg: '#eef7f3',
    paperEdgeShadow: 'rgba(20, 75, 62, 0.14)',
    gridStyle: 'graph',
    ruleLineColor: 'rgba(92, 173, 148, 0.42)',
    ruleSubLineColor: 'rgba(145, 207, 188, 0.28)',
    marginLineColor: 'rgba(16, 128, 106, 0.55)',
    holePunchColor: '#d7ebe2',
    holePunchRing: 'rgba(42, 105, 88, 0.35)',
    foldHighlight: 'rgba(255, 255, 255, 0.65)',
    foldShadow: 'rgba(18, 72, 58, 0.18)',
    p1Ink: '#0b6e66',
    p1InkLight: 'rgba(11, 110, 102, 0.22)',
    p2Ink: '#d9480f',
    p2InkLight: 'rgba(217, 72, 15, 0.22)',
    graphiteColor: '#1f292e',
    doodleInk: '#21353b',
    coffeeRingColor: 'rgba(128, 84, 46, 0.26)',
    eraserFill: '#f8fafc',
    eraserAccent: '#64748b',
    pencilWood: '#cbd5e1',
    pencilPaint: '#1e3a5f',
    pencilEraser: '#e2e8f0',
    pencilFerrule: '#94a3b8',
    hudText: '#14262b',
    hudAccent: '#0b6e66',
    cardBg: '#f6fbf9',
    cardBorder: '#0b6e66'
  },
  trapper: {
    id: 'trapper',
    name: 'Trapper Keeper Neon (1988)',
    tagline: 'Gel pens & radical laser grid',
    supporterOnly: false,
    paperBg: '#161124',
    paperEdgeShadow: 'rgba(0, 0, 0, 0.5)',
    gridStyle: 'neon_grid',
    ruleLineColor: 'rgba(139, 92, 246, 0.28)',
    ruleSubLineColor: 'rgba(236, 72, 153, 0.14)',
    marginLineColor: 'rgba(255, 42, 133, 0.6)',
    holePunchColor: '#0c0816',
    holePunchRing: 'rgba(167, 139, 250, 0.45)',
    foldHighlight: 'rgba(167, 139, 250, 0.28)',
    foldShadow: 'rgba(0, 0, 0, 0.55)',
    p1Ink: '#00f5d4',
    p1InkLight: 'rgba(0, 245, 212, 0.22)',
    p2Ink: '#ff2a85',
    p2InkLight: 'rgba(255, 42, 133, 0.22)',
    graphiteColor: '#fde047',
    doodleInk: '#c4b5fd',
    coffeeRingColor: 'rgba(244, 114, 182, 0.28)',
    eraserFill: '#a855f7',
    eraserAccent: '#f472b6',
    pencilWood: '#fde68a',
    pencilPaint: '#ec4899',
    pencilEraser: '#22d3ee',
    pencilFerrule: '#e2e8f0',
    hudText: '#f5f3ff',
    hudAccent: '#00f5d4',
    cardBg: '#221a38',
    cardBorder: '#00f5d4'
  },
  terminal: {
    id: 'terminal',
    name: 'Green-Screen Terminal',
    tagline: 'Phosphor CRT wireframe mode',
    supporterOnly: false,
    paperBg: '#0b120c',
    paperEdgeShadow: 'rgba(0, 0, 0, 0.6)',
    gridStyle: 'crt',
    ruleLineColor: 'rgba(0, 252, 81, 0.15)',
    ruleSubLineColor: 'rgba(0, 228, 154, 0.08)',
    marginLineColor: 'rgba(0, 252, 81, 0.4)',
    holePunchColor: '#050906',
    holePunchRing: 'rgba(0, 252, 81, 0.35)',
    foldHighlight: 'rgba(0, 252, 81, 0.22)',
    foldShadow: 'rgba(0, 0, 0, 0.6)',
    p1Ink: '#00fc51',
    p1InkLight: 'rgba(0, 252, 81, 0.2)',
    p2Ink: '#ffb000',
    p2InkLight: 'rgba(255, 176, 0, 0.2)',
    graphiteColor: '#8dffb0',
    doodleInk: '#00e49a',
    coffeeRingColor: 'rgba(0, 228, 154, 0.22)',
    eraserFill: '#12381c',
    eraserAccent: '#00fc51',
    pencilWood: '#4ade80',
    pencilPaint: '#00e49a',
    pencilEraser: '#ffb000',
    pencilFerrule: '#86efac',
    hudText: '#00fc51',
    hudAccent: '#ffb000',
    cardBg: '#0f1c11',
    cardBorder: '#00fc51'
  }
};

export interface DecalInfo {
  id: DecalStyle;
  name: string;
  description: string;
  supporterOnly: boolean;
}

export const DECAL_STYLES: DecalInfo[] = [
  {
    id: 'standard',
    name: 'Classic Notebook',
    description: 'Original hand-drawn Tanks, Bunkers & Radar',
    supporterOnly: false
  },
  {
    id: 'starfighter',
    name: 'Starfighters',
    description: 'Swept-wing fighters, Shield Stations & Arrays',
    supporterOnly: false
  },
  {
    id: 'ufo',
    name: 'UFO Invasion',
    description: 'Flying saucers, Mothership Cores & Beacons',
    supporterOnly: false
  },
  {
    id: 'mech',
    name: 'Retro Mechs',
    description: 'Bipedal walkers, Heavy Mechs & Sensor Pods',
    supporterOnly: false
  },
  {
    id: 'battleship',
    name: 'Paper Fleet',
    description: 'Cruisers, Dreadnoughts & Sonar Buoys',
    supporterOnly: false
  }
];
