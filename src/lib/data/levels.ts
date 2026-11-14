import type { AIPersonality, Difficulty, LevelSpec, ObstacleKind, UnitKind } from '../engine/types';

export const AI_PROFILES: Record<string, AIPersonality> = {
  doodler: {
    name: 'The Doodler',
    title: 'Period 1 Study Hall',
    quips: ['Wait, is that a tank or a potato?', 'Oops, slipped on the margin!', 'Drawing extra flames on mine...'],
    angleErrorRad: 0.22,
    powerErrorRatio: 0.22,
    obstacleAwareness: 0.25,
    thinkDelayMs: 900
  },
  daydreamer: {
    name: 'The Daydreamer',
    title: 'Window Seat Kid',
    quips: ['Ooh, nice coffee stain.', 'Five minutes til recess...', 'Trying a blind bank shot!'],
    angleErrorRad: 0.18,
    powerErrorRatio: 0.18,
    obstacleAwareness: 0.4,
    thinkDelayMs: 950
  },
  classClown: {
    name: 'The Class Clown',
    title: 'Back-Row Flicker',
    quips: ['WATCH THIS SNAP!', 'Full power!! No brakes!', 'Wait until the teacher looks away...'],
    angleErrorRad: 0.15,
    powerErrorRatio: 0.25,
    obstacleAwareness: 0.45,
    thinkDelayMs: 800
  },
  sketchArtist: {
    name: 'The Sketch Artist',
    title: 'Art Club Captain',
    quips: ['Watch the shading on this shot.', 'That Cool S was a masterpiece.', 'Threading the needle...'],
    angleErrorRad: 0.12,
    powerErrorRatio: 0.14,
    obstacleAwareness: 0.65,
    thinkDelayMs: 950
  },
  hallMonitor: {
    name: 'The Hall Monitor',
    title: 'Clipboard Enforcer',
    quips: ['No running in the margins.', 'Checking trajectory compliance.', 'Citation issued!'],
    angleErrorRad: 0.1,
    powerErrorRatio: 0.12,
    obstacleAwareness: 0.72,
    thinkDelayMs: 900
  },
  geometryNerd: {
    name: 'The Geometry Nerd',
    title: 'Protractor Tactician',
    quips: ['Calculating crease refraction...', '42.5 degrees ought to do it.', 'Angles never lie!'],
    angleErrorRad: 0.07,
    powerErrorRatio: 0.09,
    obstacleAwareness: 0.85,
    thinkDelayMs: 1050
  },
  shopKid: {
    name: 'The Woodshop Ace',
    title: 'Ruler Specialist',
    quips: ['Measure twice, flick once.', 'Freshly sharpened #2!', 'Solid oak barrier ahead.'],
    angleErrorRad: 0.065,
    powerErrorRatio: 0.09,
    obstacleAwareness: 0.88,
    thinkDelayMs: 950
  },
  detentionKing: {
    name: 'The Detention King',
    title: 'Room 204 Legend',
    quips: ['I have practiced this 500 times.', 'Your eraser cannot save you.', 'Nothing gets past the spiral!'],
    angleErrorRad: 0.05,
    powerErrorRatio: 0.07,
    obstacleAwareness: 0.92,
    thinkDelayMs: 1000
  },
  valedictorian: {
    name: 'The Valedictorian',
    title: '4.0 GPA Sniper',
    quips: ['A+ precision incoming.', 'Friction coefficient accounted for.', 'Extra credit shot.'],
    angleErrorRad: 0.038,
    powerErrorRatio: 0.055,
    obstacleAwareness: 0.96,
    thinkDelayMs: 1050
  },
  principal: {
    name: 'The Principal',
    title: 'Final Boss — Main Office',
    quips: ['See me after this match.', 'Confiscating your pencil!', 'Tenured flick mastery!'],
    angleErrorRad: 0.025,
    powerErrorRatio: 0.04,
    obstacleAwareness: 1.0,
    thinkDelayMs: 1100
  }
};

export const CAMPAIGN_LEVELS: LevelSpec[] = [
  {
    id: 1,
    name: 'Homeroom Warmup',
    subtitle: 'Clean sheet — learn the pencil flick',
    opponent: AI_PROFILES.doodler,
    p1Units: [
      { kind: 'tank', x: 115, y: 585 },
      { kind: 'tank', x: 205, y: 615 },
      { kind: 'tank', x: 295, y: 585 }
    ],
    p2Units: [
      { kind: 'tank', x: 115, y: 135 },
      { kind: 'tank', x: 205, y: 105 },
      { kind: 'tank', x: 295, y: 135 }
    ],
    obstacles: [
      { kind: 'doodle_star', x: 205, y: 360, radius: 22 }
    ]
  },
  {
    id: 2,
    name: 'The Cool S',
    subtitle: 'An iconic 80s doodle guards center fold',
    opponent: AI_PROFILES.daydreamer,
    p1Units: [
      { kind: 'tank', x: 100, y: 590 },
      { kind: 'tank', x: 200, y: 630 },
      { kind: 'tank', x: 310, y: 575 }
    ],
    p2Units: [
      { kind: 'tank', x: 105, y: 145 },
      { kind: 'tank', x: 205, y: 100 },
      { kind: 'tank', x: 310, y: 140 }
    ],
    obstacles: [
      { kind: 'cool_s', x: 205, y: 360, width: 46, height: 74, rotation: -0.1 },
      { kind: 'eraser_shavings', x: 105, y: 395, radius: 24 }
    ]
  },
  {
    id: 3,
    name: 'Coffee Break',
    subtitle: 'Watch out for sticky mug rings',
    opponent: AI_PROFILES.classClown,
    p1Units: [
      { kind: 'tank', x: 95, y: 560 },
      { kind: 'tank', x: 185, y: 635 },
      { kind: 'radar', x: 295, y: 615 },
      { kind: 'tank', x: 330, y: 525 }
    ],
    p2Units: [
      { kind: 'tank', x: 95, y: 165 },
      { kind: 'tank', x: 195, y: 95 },
      { kind: 'radar', x: 290, y: 110 },
      { kind: 'tank', x: 330, y: 185 }
    ],
    obstacles: [
      { kind: 'coffee_ring', x: 165, y: 355, radius: 44 },
      { kind: 'doodle_star', x: 300, y: 345, radius: 24 },
      { kind: 'eraser_shavings', x: 235, y: 425, radius: 22 }
    ]
  },
  {
    id: 4,
    name: 'Pink Pearl',
    subtitle: 'Heavy rubber erasers stop graphite dead',
    opponent: AI_PROFILES.sketchArtist,
    p1Units: [
      { kind: 'tank', x: 95, y: 600 },
      { kind: 'bunker', x: 205, y: 610 },
      { kind: 'tank', x: 315, y: 600 }
    ],
    p2Units: [
      { kind: 'tank', x: 100, y: 120 },
      { kind: 'bunker', x: 205, y: 115 },
      { kind: 'tank', x: 315, y: 120 }
    ],
    obstacles: [
      { kind: 'eraser', x: 205, y: 360, width: 88, height: 34, rotation: 0.12 },
      { kind: 'cool_s', x: 105, y: 320, width: 38, height: 60, rotation: 0.18 },
      { kind: 'paper_clip', x: 315, y: 400, width: 52, height: 22, rotation: -0.35 }
    ]
  },
  {
    id: 5,
    name: 'Spiral Binding',
    subtitle: 'Bank around clips and armored bunkers',
    opponent: AI_PROFILES.hallMonitor,
    p1Units: [
      { kind: 'tank', x: 95, y: 540 },
      { kind: 'bunker', x: 175, y: 625 },
      { kind: 'radar', x: 265, y: 635 },
      { kind: 'tank', x: 335, y: 550 }
    ],
    p2Units: [
      { kind: 'tank', x: 95, y: 175 },
      { kind: 'bunker', x: 185, y: 95 },
      { kind: 'radar', x: 275, y: 95 },
      { kind: 'tank', x: 335, y: 165 }
    ],
    obstacles: [
      { kind: 'spiral_wire', x: 56, y: 360, width: 26, height: 180, rotation: 0 },
      { kind: 'eraser', x: 270, y: 350, width: 74, height: 30, rotation: -0.22 },
      { kind: 'paper_clip', x: 155, y: 365, width: 58, height: 24, rotation: 0.4 }
    ]
  },
  {
    id: 6,
    name: 'Pop Quiz',
    subtitle: 'Twin erasers & cluttered margin doodles',
    opponent: AI_PROFILES.geometryNerd,
    p1Units: [
      { kind: 'tank', x: 95, y: 615 },
      { kind: 'bunker', x: 165, y: 530 },
      { kind: 'tank', x: 255, y: 635 },
      { kind: 'radar', x: 330, y: 545 }
    ],
    p2Units: [
      { kind: 'radar', x: 95, y: 160 },
      { kind: 'tank', x: 175, y: 95 },
      { kind: 'bunker', x: 260, y: 185 },
      { kind: 'tank', x: 335, y: 105 }
    ],
    obstacles: [
      { kind: 'eraser', x: 135, y: 340, width: 72, height: 28, rotation: 0.25 },
      { kind: 'eraser', x: 285, y: 380, width: 72, height: 28, rotation: -0.25 },
      { kind: 'coffee_ring', x: 215, y: 280, radius: 36 },
      { kind: 'eraser_shavings', x: 205, y: 445, radius: 25 }
    ]
  },
  {
    id: 7,
    name: 'Geometry Class',
    subtitle: 'Angled wooden rulers narrow the lanes',
    opponent: AI_PROFILES.shopKid,
    p1Units: [
      { kind: 'tank', x: 90, y: 590 },
      { kind: 'bunker', x: 175, y: 635 },
      { kind: 'bunker', x: 255, y: 550 },
      { kind: 'tank', x: 335, y: 615 }
    ],
    p2Units: [
      { kind: 'tank', x: 90, y: 120 },
      { kind: 'bunker', x: 175, y: 175 },
      { kind: 'bunker', x: 260, y: 90 },
      { kind: 'tank', x: 335, y: 135 }
    ],
    obstacles: [
      { kind: 'ruler', x: 130, y: 360, width: 105, height: 22, rotation: -0.35 },
      { kind: 'ruler', x: 290, y: 360, width: 105, height: 22, rotation: 0.35 },
      { kind: 'doodle_star', x: 210, y: 260, radius: 22 },
      { kind: 'doodle_star', x: 210, y: 460, radius: 22 }
    ]
  },
  {
    id: 8,
    name: 'Detention Hall',
    subtitle: 'Five-unit squads across a scarred desk',
    opponent: AI_PROFILES.detentionKing,
    p1Units: [
      { kind: 'tank', x: 85, y: 545 },
      { kind: 'bunker', x: 155, y: 625 },
      { kind: 'radar', x: 225, y: 555 },
      { kind: 'bunker', x: 290, y: 635 },
      { kind: 'tank', x: 345, y: 540 }
    ],
    p2Units: [
      { kind: 'tank', x: 85, y: 170 },
      { kind: 'bunker', x: 155, y: 95 },
      { kind: 'radar', x: 225, y: 165 },
      { kind: 'bunker', x: 290, y: 95 },
      { kind: 'tank', x: 345, y: 175 }
    ],
    obstacles: [
      { kind: 'eraser', x: 215, y: 360, width: 84, height: 32, rotation: 0 },
      { kind: 'cool_s', x: 110, y: 360, width: 42, height: 68, rotation: -0.15 },
      { kind: 'paper_clip', x: 320, y: 355, width: 54, height: 24, rotation: 0.5 },
      { kind: 'coffee_ring', x: 280, y: 260, radius: 34 }
    ]
  },
  {
    id: 9,
    name: 'Final Exam',
    subtitle: 'Fortified bunkers & razor-thin sightlines',
    opponent: AI_PROFILES.valedictorian,
    p1Units: [
      { kind: 'bunker', x: 95, y: 575 },
      { kind: 'tank', x: 165, y: 645 },
      { kind: 'radar', x: 225, y: 530 },
      { kind: 'tank', x: 285, y: 645 },
      { kind: 'bunker', x: 340, y: 570 }
    ],
    p2Units: [
      { kind: 'bunker', x: 95, y: 145 },
      { kind: 'tank', x: 165, y: 80 },
      { kind: 'radar', x: 225, y: 190 },
      { kind: 'tank', x: 285, y: 80 },
      { kind: 'bunker', x: 340, y: 150 }
    ],
    obstacles: [
      { kind: 'ruler', x: 215, y: 360, width: 112, height: 22, rotation: 0.08 },
      { kind: 'eraser', x: 105, y: 315, width: 66, height: 28, rotation: -0.35 },
      { kind: 'eraser', x: 325, y: 405, width: 66, height: 28, rotation: -0.35 },
      { kind: 'eraser_shavings', x: 120, y: 440, radius: 24 },
      { kind: 'doodle_star', x: 305, y: 280, radius: 22 }
    ]
  },
  {
    id: 10,
    name: "Principal's Desk",
    subtitle: 'Ultimate notebook duel — no mercy',
    opponent: AI_PROFILES.principal,
    p1Units: [
      { kind: 'bunker', x: 95, y: 615 },
      { kind: 'tank', x: 155, y: 535 },
      { kind: 'bunker', x: 220, y: 640 },
      { kind: 'radar', x: 285, y: 535 },
      { kind: 'tank', x: 340, y: 615 }
    ],
    p2Units: [
      { kind: 'bunker', x: 95, y: 105 },
      { kind: 'tank', x: 155, y: 185 },
      { kind: 'bunker', x: 220, y: 80 },
      { kind: 'radar', x: 285, y: 185 },
      { kind: 'tank', x: 340, y: 105 }
    ],
    obstacles: [
      { kind: 'spiral_wire', x: 56, y: 360, width: 26, height: 200, rotation: 0 },
      { kind: 'eraser', x: 145, y: 360, width: 72, height: 28, rotation: 0.2 },
      { kind: 'ruler', x: 285, y: 360, width: 96, height: 22, rotation: -0.22 },
      { kind: 'cool_s', x: 215, y: 270, width: 40, height: 62, rotation: 0.1 },
      { kind: 'coffee_ring', x: 215, y: 455, radius: 36 }
    ]
  }
];

export function generateSkirmishLevel(difficulty: Difficulty, unitCount = 4): LevelSpec {
  const opponentByDiff: Record<Difficulty, AIPersonality> = {
    easy: AI_PROFILES.doodler,
    medium: AI_PROFILES.geometryNerd,
    hard: AI_PROFILES.principal
  };

  const kindsPool: UnitKind[] = ['tank', 'tank', 'bunker', 'radar', 'tank'];
  const p1Units: LevelSpec['p1Units'] = [];
  const p2Units: LevelSpec['p2Units'] = [];

  const minX = 85;
  const maxX = 345;
  const stepX = (maxX - minX) / Math.max(1, unitCount - 1);

  for (let i = 0; i < unitCount; i++) {
    const jitterX = (Math.random() - 0.5) * 24;
    const x1 = Math.max(76, Math.min(354, minX + i * stepX + jitterX));
    const y1 = 530 + Math.random() * 115;
    const x2 = Math.max(76, Math.min(354, minX + i * stepX + (Math.random() - 0.5) * 24));
    const y2 = 80 + Math.random() * 115;
    const kind = kindsPool[i % kindsPool.length];
    p1Units.push({ kind, x: Math.round(x1), y: Math.round(y1) });
    p2Units.push({ kind, x: Math.round(x2), y: Math.round(y2) });
  }

  const obstacleKinds: ObstacleKind[] = [
    'cool_s',
    'doodle_star',
    'coffee_ring',
    'eraser_shavings',
    'paper_clip',
    'eraser',
    'ruler'
  ];

  const obstacleCount = 3 + Math.floor(Math.random() * 2);
  const obstacles: LevelSpec['obstacles'] = [];
  for (let i = 0; i < obstacleCount; i++) {
    const kind = obstacleKinds[Math.floor(Math.random() * obstacleKinds.length)];
    const x = 95 + (i * 230) / Math.max(1, obstacleCount - 1) + (Math.random() - 0.5) * 35;
    const y = 315 + Math.random() * 90;
    const rotation = (Math.random() - 0.5) * 0.7;

    if (kind === 'eraser') {
      obstacles.push({ kind, x, y, width: 76, height: 30, rotation });
    } else if (kind === 'ruler') {
      obstacles.push({ kind, x, y, width: 96, height: 22, rotation });
    } else if (kind === 'cool_s') {
      obstacles.push({ kind, x, y, width: 42, height: 68, rotation });
    } else if (kind === 'paper_clip') {
      obstacles.push({ kind, x, y, width: 54, height: 24, rotation });
    } else if (kind === 'coffee_ring') {
      obstacles.push({ kind, x, y, radius: 36 });
    } else {
      obstacles.push({ kind, x, y, radius: 23 });
    }
  }

  return {
    id: 0,
    name: `Skirmish (${difficulty.toUpperCase()})`,
    subtitle: 'Randomized notebook duel',
    opponent: opponentByDiff[difficulty],
    p1Units,
    p2Units,
    obstacles
  };
}
