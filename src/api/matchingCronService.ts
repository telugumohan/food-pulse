import { runAndPersistMatchingCycle } from './supabaseApi';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MatchAllocation } from './types';

export interface CronLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface CronState {
  isRunning: boolean;
  intervalSeconds: number;
  stats: {
    totalCycles: number;
    totalMatches: number;
    lastRunAt: string | null;
  };
  logs: CronLog[];
}

type CronListener = (state: CronState) => void;

class MatchingCronService {
  private timer: NodeJS.Timeout | null = null;
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private isRunning: boolean = false;
  private intervalSeconds: number = 10;
  private listeners: Set<CronListener> = new Set();
  private stats = {
    totalCycles: 0,
    totalMatches: 0,
    lastRunAt: null as string | null,
  };
  private logs: CronLog[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('foodpulse_cron_active');
      if (saved === 'true') {
        // Auto-start cron if was active
        setTimeout(() => this.start(), 500);
      }
    }
  }

  public getState(): CronState {
    return {
      isRunning: this.isRunning,
      intervalSeconds: this.intervalSeconds,
      stats: { ...this.stats },
      logs: [...this.logs],
    };
  }

  public subscribe(listener: CronListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch {}
    });
  }

  public addLog(message: string, type: CronLog['type'] = 'info') {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log: CronLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
      message,
      type,
    };
    this.logs = [log, ...this.logs.slice(0, 49)];
    this.notify();
  }

  public async runCycle(triggerReason?: string): Promise<MatchAllocation[]> {
    this.stats.totalCycles += 1;
    this.stats.lastRunAt = new Date().toISOString();

    const reason = triggerReason ? `[${triggerReason}] ` : '';
    this.addLog(`${reason}Checking active proposals and requests...`, 'info');

    try {
      const res = await runAndPersistMatchingCycle();
      if (res.error) {
        this.addLog(`${reason}Cycle error: ${res.error.message}`, 'error');
        return [];
      }

      const matches = res.data ?? [];
      if (matches.length > 0) {
        this.stats.totalMatches += matches.length;
        const totalMeals = matches.reduce((s, m) => s + m.totalAllocated, 0);
        const vols = matches.filter((m) => m.volunteerId).length;

        this.addLog(
          `🎉 ${reason}Matched ${matches.length} pair${matches.length > 1 ? 's' : ''} (${totalMeals} total meals)! Assigned to ${vols} volunteer${vols > 1 ? 's' : ''}.`,
          'success',
        );
      } else {
        this.addLog(`${reason}Network balanced — all active items matched or no pending requests.`, 'info');
      }

      this.notify();
      return matches;
    } catch (err) {
      this.addLog(`${reason}Unexpected error: ${String(err)}`, 'error');
      return [];
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodpulse_cron_active', 'true');
    }

    this.addLog('⚡ Automated Matching Cron started (Interval: 10s + Realtime listening).', 'success');

    void this.runCycle('Initial Start');

    this.timer = setInterval(() => {
      void this.runCycle('Periodic 10s Cron');
    }, this.intervalSeconds * 1000);

    if (isSupabaseConfigured) {
      try {
        this.channel = supabase
          .channel('foodpulse-matching-cron')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'donations' },
            () => {
              void this.runCycle('Realtime: New Donation Posted');
            },
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'food_requests' },
            () => {
              void this.runCycle('Realtime: New Food Request Created');
            },
          )
          .subscribe();
      } catch (e) {
        console.warn('Supabase realtime subscription error:', e);
      }
    }

    this.notify();
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodpulse_cron_active', 'false');
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.channel) {
      void this.channel.unsubscribe();
      this.channel = null;
    }

    this.addLog('🛑 Automated Matching Cron stopped.', 'warning');
    this.notify();
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }
}

export const matchingCronService = new MatchingCronService();
