import * as SQLite from 'expo-sqlite';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { canFetch, fetchEnvironment, isStale, type Coordinates } from '../api/openMeteo';
import {
  getLastEnvironmentFetch,
  getProfile,
  insertPrediction,
  loadFeatureInputRows,
  saveCheckIn as saveCheckInRow,
  upsertEnvironment,
} from '../db/queries';
import { resetDatabase, runMigrations } from '../db/migrations';
import { DATABASE_NAME } from '../db/schema';
import { buildDailyFrame, checkinDayCount, MIN_HISTORY_DAYS } from '../logic/frame';
import { rulebook } from '../logic/rulebook';
import { deriveRiskState, type RiskState } from '../logic/risk';
import type { CheckIn, Profile } from '../types/models';
import { todayLocal } from '../utils/dates';

export { rulebook };
export type { RiskState } from '../logic/risk';

export type EnvironmentStatus = 'idle' | 'fetching' | 'ok' | 'unavailable';

interface AppState {
  ready: boolean;
  profile: Profile | null;
  risk: RiskState;
  environmentStatus: EnvironmentStatus;
  checkinDays: number;
  today: string;
  todayLogged: boolean;
  db: SQLite.SQLiteDatabase | null;
  refresh: () => Promise<void>;
  saveCheckIn: (checkIn: CheckIn) => Promise<void>;
  setProfile: (profile: Profile) => void;
  refreshEnvironment: (coordinates: Coordinates, force?: boolean) => Promise<boolean>;
  deleteAllData: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  const fetchInFlight = useRef(false);
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [risk, setRisk] = useState<RiskState>({ status: 'loading' });
  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>('idle');
  const [checkinDays, setCheckinDays] = useState(0);
  const [todayLogged, setTodayLogged] = useState(false);
  const today = todayLocal();

  const recompute = useCallback(async (): Promise<void> => {
    const db = dbRef.current;
    if (!db) return;

    try {
      const rows = await loadFeatureInputRows(db, todayLocal());
      setCheckinDays(checkinDayCount(buildDailyFrame(rows)));
      setTodayLogged(rows.some((r) => r.date === todayLocal() && r.severity != null));

      const next = deriveRiskState(rows, rulebook);
      setRisk(next);

      if (next.status === 'ready') {
        try {
          await insertPrediction(db, {
            computedAt: new Date().toISOString(),
            forDate: next.date,
            probability: next.score / 100,
            band: next.band,
            modelVersion: rulebook.rulebook_version,
            topFeatures: next.drivers.map((r) => ({ feature: r.id, contribution: r.points })),
            source: 'local',
          });
        } catch (error) {
          console.error('[flare-down] could not log prediction', error);
        }
      }
    } catch (error) {
      console.error('[flare-down] recompute failed', error);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    const db = dbRef.current;
    if (!db) return;
    try {
      setProfileState(await getProfile(db));
    } catch (error) {
      console.error('[flare-down] could not reload profile', error);
    }
    await recompute();
  }, [recompute]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
        await runMigrations(db);
        if (cancelled) return;
        dbRef.current = db;
        setProfileState(await getProfile(db));
        await recompute();
      } catch (error) {
        console.error('[flare-down] database init failed', error);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recompute]);

  const saveCheckIn = useCallback(
    async (checkIn: CheckIn): Promise<void> => {
      const db = dbRef.current;
      if (!db) return;
      await saveCheckInRow(db, checkIn);
      await recompute();
    },
    [recompute],
  );

  const setProfile = useCallback((next: Profile): void => {
    setProfileState(next);
  }, []);

  const refreshEnvironment = useCallback(
    async (coordinates: Coordinates, force = false): Promise<boolean> => {
      const db = dbRef.current;
      if (!db) return false;

      if (fetchInFlight.current) return false;

      const lastFetch = await getLastEnvironmentFetch(db);
      if (!canFetch(lastFetch)) return false;
      if (!force && !isStale(lastFetch)) return false;

      fetchInFlight.current = true;
      setEnvironmentStatus('fetching');
      try {
        const { days, ok } = await fetchEnvironment(coordinates, todayLocal());
        if (!ok || days.length === 0) {
          setEnvironmentStatus('unavailable');
          return false;
        }
        await upsertEnvironment(db, days);
        setEnvironmentStatus('ok');
        await recompute();
        return true;
      } catch (error) {
        console.warn('[flare-down] environment refresh failed', error);
        setEnvironmentStatus('unavailable');
        return false;
      } finally {
        fetchInFlight.current = false;
      }
    },
    [recompute],
  );

  const deleteAllData = useCallback(async (): Promise<void> => {
    const db = dbRef.current;
    if (!db) return;
    await resetDatabase(db);
    setProfileState(null);
    setCheckinDays(0);
    setTodayLogged(false);
    setEnvironmentStatus('idle');
    setRisk({ status: 'collecting', days: 0, required: MIN_HISTORY_DAYS });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      profile,
      risk,
      environmentStatus,
      checkinDays,
      today,
      todayLogged,
      db: dbRef.current,
      refresh,
      saveCheckIn,
      setProfile,
      refreshEnvironment,
      deleteAllData,
    }),
    [
      ready,
      profile,
      risk,
      environmentStatus,
      checkinDays,
      today,
      todayLogged,
      refresh,
      saveCheckIn,
      setProfile,
      refreshEnvironment,
      deleteAllData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}
