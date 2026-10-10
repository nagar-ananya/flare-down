import rulebookJson from '../../assets/rulebook.json';

export type RiskBand = 'low' | 'elevated' | 'high';

export type How = 'today' | 'average' | 'highest' | 'lowest' | 'total';

export interface LookAt {
  column: string;
  how: How;
  from?: number;
  to?: number;
}

export interface Rule {
  id: string;
  label: string;
  variable: string;
  points: number;
  look_at: LookAt;
  low: number;
  high: number;
}

export interface RulebookResults {
  measured_at: string;
  panel_seed: number;
  tested_on_patients: string;
  tested_on_days: number;
  base_rate: number;
  flare_rate_when_high: number;
  flare_rate_when_low: number;
  recall_at_high: number;
  average_precision: number;
  trigger_recovery: number;
  trigger_recovery_by_chance: number;
}

export interface Rulebook {
  schema_version: number;
  rulebook_version: string;
  authored_at: string;
  horizon_hours: number;
  min_days_required: number;
  bands: { elevated: number; high: number };
  results: RulebookResults;
  rules: readonly Rule[];
}

export const rulebook = rulebookJson as unknown as Rulebook;

export function ruleNumber(id: string, book: Rulebook = rulebook): number {
  return book.rules.findIndex((r) => r.id === id) + 1;
}
