export type Team = 'p1' | 'p2';

export type UnitKind = 'tank' | 'bunker' | 'radar';

export type DecalStyle = 'standard' | 'starfighter' | 'ufo' | 'mech' | 'battleship';

export type ThemeId = 'classic' | 'graph' | 'trapper' | 'terminal';

export type GameMode = 'campaign' | 'pass_and_play' | 'skirmish';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ControlMode = 'slingshot' | 'flick';

export type TurnPhase =
  | 'PLAYER_AIM'
  | 'PROJECTILE_ANIMATING'
  | 'AI_THINKING'
  | 'AI_ANIMATING'
  | 'GAME_OVER';

export interface Unit {
  id: string;
  team: Team;
  kind: UnitKind;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  aimAngle: number;
  seed: number;
  hitFlash: number;
}

export type ObstacleKind =
  | 'cool_s'
  | 'doodle_star'
  | 'coffee_ring'
  | 'eraser_shavings'
  | 'paper_clip'
  | 'eraser'
  | 'ruler'
  | 'spiral_wire';

export type ObstacleWeight = 'light' | 'heavy';

export interface Obstacle {
  id: string;
  kind: ObstacleKind;
  weight: ObstacleWeight;
  shape: 'circle' | 'rect';
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  rotation?: number;
  seed: number;
  label?: string;
}

export interface Projectile {
  ownerTeam: Team;
  originUnitId: string;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  initialSpeed: number;
  pressure: number;
  distanceTraveled: number;
  crossedFold: boolean;
  wobblePhase: number;
  wobbleFreq: number;
  active: boolean;
  hitObstacleCooldowns: Record<string, number>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  color: string;
  kind: 'paper' | 'graphite' | 'ink' | 'rubber';
}

export interface AIPersonality {
  name: string;
  title: string;
  quips: string[];
  angleErrorRad: number;
  powerErrorRatio: number;
  obstacleAwareness: number; // 0 to 1
  thinkDelayMs: number;
}

export interface LevelSpec {
  id: number;
  name: string;
  subtitle: string;
  opponent: AIPersonality;
  p1Units: Array<{ kind: UnitKind; x: number; y: number }>;
  p2Units: Array<{ kind: UnitKind; x: number; y: number }>;
  obstacles: Array<{
    kind: ObstacleKind;
    x: number;
    y: number;
    radius?: number;
    width?: number;
    height?: number;
    rotation?: number;
  }>;
}

export interface MatchStats {
  winner: Team;
  mode: GameMode;
  levelId?: number;
  levelName?: string;
  p1Shots: number;
  p1Hits: number;
  p2Shots: number;
  p2Hits: number;
  p1Remaining: number;
  p1Total: number;
  p2Remaining: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'F';
  teacherNote: string;
}

export interface AimState {
  unitId: string | null;
  pointerId: number | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pullAngle: number; // Direction of fire (radians)
  power: number; // 0..1 normalized
  isDragging: boolean;
  lastDragTime: number;
  flickVx: number;
  flickVy: number;
}
