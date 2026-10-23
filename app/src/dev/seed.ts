import type { SQLiteDatabase } from 'expo-sqlite';

import { saveCheckIn } from '../db/queries';
import { emptyCheckIn, type CheckIn } from '../types/models';
import { addDays, todayLocal } from '../utils/dates';

// Demo data for testing. Only shown in developer mode (tap the Settings footer 5 times).

export const DEV_TOOLS_ENABLED: boolean = __DEV__;

export const DEV_MODE_KEY = 'dev_mode';

export const DEV_MODE_TAPS = 5;

export const DEFAULT_SEED_DAYS = 30;

// One value per day, oldest first, ending yesterday. Today is left empty so it
// can be logged in the demo. The numbers put the score right around the Elevated
// line (30), so a rough check-in today (skin, itch, sleep, food) pushes it into High.
const SEVERITY = [3, 3, 4, 3, 3, 2, 3, 3, 2, 3, 3, 4, 3, 3, 3, 4, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 2, 3, 3, 3];
const ITCH = [2, 3, 3, 2, 2, 2, 3, 2, 2, 2, 3, 3, 2, 2, 3, 3, 2, 2, 2, 2, 3, 2, 2, 2, 3, 3, 3, 3, 4, 4];
const STRESS = [3, 3, 4, 3, 2, 3, 4, 3, 3, 2, 3, 4, 3, 3, 4, 3, 5, 5, 6, 5, 5, 4, 5, 5, 3, 3, 4, 3, 3, 3];
const SLEEP = [7.5, 7, 8, 7.5, 7, 7.5, 8, 7, 7.5, 7, 8, 7.5, 7, 7.5, 7, 7, 6.5, 7, 6.5, 7, 6.5, 7, 7, 7.5, 6.5, 7, 6, 6.5, 6.5, 6.5];
const NIGHTSHADES = [0, 0, 2, 1, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0];
const PROCESSED = [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0];

// Days ago (counting yesterday as 1) for the yes/no answers. Only the sore throat
// is recent enough for its rule to count it.
const SICK_DAYS = [17, 18, 19];
const SORE_THROAT_DAYS = [11];
const INJURY_DAYS = [21];

// Small repeatable random numbers for the answers no rule uses.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeedResult {
  days: number;
  from: string;
  to: string;
}

export async function seedDemoCheckIns(
  db: SQLiteDatabase,
  days: number = DEFAULT_SEED_DAYS,
  seed = 20260730,
): Promise<SeedResult> {
  const random = mulberry32(seed);
  const yesterday = addDays(todayLocal(), -1);
  const count = Math.min(days, SEVERITY.length);
  const from = addDays(yesterday, -(count - 1));

  for (let i = 0; i < count; i++) {
    const daysAgo = count - i;
    const at = SEVERITY.length - count + i;
    const date = addDays(yesterday, -(daysAgo - 1));

    const checkIn: CheckIn = {
      ...emptyCheckIn(date),
      severity: SEVERITY[at],
      itch: ITCH[at],
      stress: STRESS[at],
      sleepHours: SLEEP[at],
      nightshadeServings: NIGHTSHADES[at],
      dietProcessed: PROCESSED[at] === 1,
      illness: SICK_DAYS.includes(daysAgo),
      soreThroat: SORE_THROAT_DAYS.includes(daysAgo),
      skinInjury: INJURY_DAYS.includes(daysAgo),
      waterGlasses: Math.round(5 + random() * 4),
      dietDairy: random() < 0.45,
      dietGluten: random() < 0.55,
      dietSugar: random() < 0.45,
      dietRedMeat: random() < 0.25,
      medTaken: random() < 0.85,
    };

    await saveCheckIn(db, checkIn);
  }

  return { days: count, from, to: yesterday };
}
