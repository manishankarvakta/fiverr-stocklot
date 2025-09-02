'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BuyerLocation = {
  latlng?: { lat: number; lng: number };
  province?: string;
  country?: string;
  lastUpdated?: number;
  accuracy?: number; // GPS accuracy in meters
};

type LocationState = {
  loc: BuyerLocation;
  isStale: () => boolean;
  set: (patch: Partial<BuyerLocation>) => void;
  setGPS: (lat: number, lng: number, accuracy?: number) => void;
  setManual: (province?: string, country?: string) => void;
  clear: () => void;
};

const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

export const useBuyerLocation = create<LocationState>()(
  persist(
    (set, get) => ({
      loc: { country: 'ZA' },
      
      isStale: () => {
        const { lastUpdated } = get().loc;
        if (!lastUpdated) return true;
        return Date.now() - lastUpdated > STALE_THRESHOLD;
      },
      
      set: (patch) => set(state => ({ 
        loc: { 
          ...state.loc, 
          ...patch, 
          lastUpdated: Date.now() 
        } 
      })),
      
      setGPS: (lat, lng, accuracy) => set(state => ({
        loc: {
          ...state.loc,
          latlng: { lat, lng },
          accuracy,
          lastUpdated: Date.now()
        }
      })),
      
      setManual: (province, country) => set(state => ({
        loc: {
          ...state.loc,
          province,
          country: country || state.loc.country,
          lastUpdated: Date.now()
        }
      })),
      
      clear: () => set({ loc: { country: 'ZA' } })
    }),
    {
      name: 'buyer-location',
      partialize: (state) => ({ loc: state.loc })
    }
  )
);