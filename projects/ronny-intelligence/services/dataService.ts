
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnalysisResult } from '../types';

let supabase: SupabaseClient | null = null;
let isCloudEnabled = false;

export const initSupabase = (url: string, key: string) => {
  if (url && key) {
    try {
      supabase = createClient(url, key);
      isCloudEnabled = true;
      return true;
    } catch (e) {
      console.error("Supabase init failed", e);
      isCloudEnabled = false;
      return false;
    }
  }
  supabase = null;
  isCloudEnabled = false;
  return false;
};

export const getSupabaseClient = () => supabase;

export const isCloudMode = () => isCloudEnabled;

// In-memory cache to prevent repeatedly parsing multi-megabyte JSON from localStorage
let memoryHistoryCache: AnalysisResult[] | null = null;

// Fetch All Data
export const fetchHistory = async (): Promise<AnalysisResult[]> => {
  if (isCloudEnabled && supabase) {
    const { data, error } = await supabase
      .from('leads')
      .select('data')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Cloud fetch error:", error);
      throw error;
    }
    const list = data ? data.map((row: any) => row.data) : [];
    memoryHistoryCache = list;
    return list;
  } else {
    // Local Storage Fallback with memory cache
    if (memoryHistoryCache) return memoryHistoryCache;
    try {
      const saved = localStorage.getItem('duediligence_history');
      memoryHistoryCache = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse localStorage history', e);
      memoryHistoryCache = [];
    }
    return memoryHistoryCache || [];
  }
};

// Save (Upsert) Single Item
export const saveHistoryItem = async (item: AnalysisResult) => {
  if (isCloudEnabled && supabase) {
    // In DB, we store: id (UUID), timestamp (bigint), data (jsonb)
    const { error } = await supabase
      .from('leads')
      .upsert({ 
        id: item.id, 
        timestamp: item.timestamp, 
        data: item 
      });
    
    if (error) throw error;
  } else {
    // Fast local memory cache update first
    if (!memoryHistoryCache) {
      memoryHistoryCache = await fetchHistory();
    }
    const index = memoryHistoryCache.findIndex(i => i.id === item.id);
    if (index >= 0) {
      memoryHistoryCache[index] = item;
    } else {
      memoryHistoryCache.unshift(item);
    }
    try {
      localStorage.setItem('duediligence_history', JSON.stringify(memoryHistoryCache));
    } catch (e) {
      console.error('Failed to persist history item to localStorage', e);
    }
  }
};

// Save Entire List (Debounced write to persistent storage)
export const saveAllHistory = async (history: AnalysisResult[]) => {
  memoryHistoryCache = history;
  if (!isCloudEnabled) {
    try {
      localStorage.setItem('duediligence_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to persist history to localStorage', e);
    }
  }
};

// Clear History
export const clearAllHistory = async () => {
  memoryHistoryCache = [];
  if (isCloudEnabled && supabase) {
    const { error } = await supabase
      .from('leads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Hack to delete all rows
    if (error) throw error;
  } else {
    localStorage.removeItem('duediligence_history');
  }
};
