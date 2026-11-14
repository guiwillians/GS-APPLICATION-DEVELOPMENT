import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { loadState, saveState, clearState } from '../storage/storage';
import { fetchWeather } from '../services/weatherApi';
import { buildAlerts } from '../services/forecast';

const Ctx = createContext(null);

const initial = {
  hydrated: false,
  thresholdPct: 15,
  decisions: [],
  reports: [],
  weather: null,
  weatherStatus: 'idle', // idle | loading | ok | error
  weatherError: null,
};

function reducer(state, a) {
  switch (a.type) {
    case 'HYDRATE':
      return {
        ...state,
        hydrated: true,
        thresholdPct: a.payload.thresholdPct ?? state.thresholdPct,
        decisions: a.payload.decisions ?? [],
        reports: a.payload.reports ?? [],
        weather: a.payload.weather ?? null,
      };
    case 'SET_THRESHOLD':
      return { ...state, thresholdPct: a.payload };
    case 'ADD_DECISION':
      return { ...state, decisions: [a.payload, ...state.decisions] };
    case 'ADD_REPORT':
      return { ...state, reports: [a.payload, ...state.reports] };
    case 'DELETE_REPORT':
      return { ...state, reports: state.reports.filter((r) => r.id !== a.payload) };
    case 'WEATHER_LOADING':
      return { ...state, weatherStatus: 'loading', weatherError: null };
    case 'WEATHER_OK':
      return { ...state, weather: a.payload, weatherStatus: 'ok', weatherError: null };
    case 'WEATHER_ERROR':
      return { ...state, weatherStatus: 'error', weatherError: a.payload };
    case 'CLEAR_ALL':
      return { ...initial, hydrated: true };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    loadState().then((saved) => dispatch({ type: 'HYDRATE', payload: saved || {} }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    saveState({
      thresholdPct: state.thresholdPct,
      decisions: state.decisions,
      reports: state.reports,
      weather: state.weather,
    });
  }, [state.hydrated, state.thresholdPct, state.decisions, state.reports, state.weather]);

  const refreshWeather = useCallback(async () => {
    dispatch({ type: 'WEATHER_LOADING' });
    try {
      const w = await fetchWeather();
      dispatch({ type: 'WEATHER_OK', payload: w });
    } catch (e) {
      dispatch({ type: 'WEATHER_ERROR', payload: e.message || 'Erro desconhecido' });
    }
  }, []);

  useEffect(() => {
    if (state.hydrated) refreshWeather();
  }, [state.hydrated, refreshWeather]);

  const alerts = useMemo(() => buildAlerts(state.thresholdPct, state.weather), [state.thresholdPct, state.weather]);

  // decisions é ordenado do mais recente para o mais antigo: a primeira ocorrência vence
  const decisionByAlert = useMemo(() => {
    const map = {};
    state.decisions.forEach((d) => {
      if (!map[d.alertId]) map[d.alertId] = d;
    });
    return map;
  }, [state.decisions]);

  const value = useMemo(
    () => ({
      ...state,
      alerts,
      decisionByAlert,
      refreshWeather,
      setThreshold: (p) => dispatch({ type: 'SET_THRESHOLD', payload: p }),
      addDecision: (d) => dispatch({ type: 'ADD_DECISION', payload: d }),
      addReport: (r) => dispatch({ type: 'ADD_REPORT', payload: r }),
      deleteReport: (id) => dispatch({ type: 'DELETE_REPORT', payload: id }),
      clearAll: async () => {
        await clearState();
        dispatch({ type: 'CLEAR_ALL' });
      },
    }),
    [state, alerts, decisionByAlert, refreshWeather],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp deve ser usado dentro de AppProvider');
  return v;
}
