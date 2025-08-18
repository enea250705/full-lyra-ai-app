import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Use require to avoid needing resolveJsonModule
const en = require('./en.json');
const it = require('./it.json');

// Optional locales (minimal stubs can be extended over time)
const ja = require('./ja.json');
const ko = require('./ko.json');
const ar = require('./ar.json');
const zh = require('./zh.json');
const de = require('./de.json');
const fr = require('./fr.json');
const es = require('./es.json');
const tr = require('./tr.json');
const ru = require('./ru.json');
const ptBR = require('./pt-BR.json');

type Dictionary = Record<string, any>;

const LOCALES: Record<string, Dictionary> = {
  en,
  it,
  ja,
  ko,
  ar,
  zh,
  de,
  fr,
  es,
  tr,
  ru,
  'pt-BR': ptBR,
};

const RTL_LANGS = new Set(['ar']);

function getNested(dict: Dictionary, path: string): string | undefined {
  const parts = path.split('.');
  let current: any = dict;
  for (const part of parts) {
    if (current && Object.prototype.hasOwnProperty.call(current, part)) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function translate(locale: string, key: string, params?: Record<string, string | number>) {
  const primary = LOCALES[locale] || en;
  const fallback = en;
  let template = getNested(primary, key) ?? getNested(fallback, key) ?? key;
  if (params && typeof template === 'string') {
    Object.entries(params).forEach(([k, v]) => {
      template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return template;
}

interface I18nContextValue {
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (code: string) => Promise<void>;
  languages: Array<{ code: string; label: string }>;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>('en');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('appLanguage');
      if (stored && LOCALES[stored]) {
        setLocaleState(stored);
        if (RTL_LANGS.has(stored)) {
          I18nManager.forceRTL(true);
        } else {
          I18nManager.forceRTL(false);
        }
      }
    })();
  }, []);

  const setLocale = async (code: string) => {
    if (!LOCALES[code]) code = 'en';
    setLocaleState(code);
    await AsyncStorage.setItem('appLanguage', code);
    if (RTL_LANGS.has(code)) {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
  };

  const t = useMemo(() => (key: string, params?: Record<string, string | number>) => translate(locale, key, params), [locale]);

  const languages = useMemo(() => {
    const map = LOCALES.en?.languages || {};
    return [
      { code: 'en', label: map.en || 'English' },
      { code: 'it', label: map.it || 'Italiano' },
      { code: 'ja', label: map.ja || '日本語' },
      { code: 'ko', label: map.ko || '한국어' },
      { code: 'ar', label: map.ar || 'العربية' },
      { code: 'zh', label: map.zh || '简体中文' },
      { code: 'de', label: map.de || 'Deutsch' },
      { code: 'fr', label: map.fr || 'Français' },
      { code: 'es', label: map.es || 'Español' },
      { code: 'tr', label: map.tr || 'Türkçe' },
      { code: 'ru', label: map.ru || 'Русский' },
      { code: 'pt-BR', label: map['pt-BR'] || 'Português (Brasil)' },
    ];
  }, []);

  const value: I18nContextValue = {
    locale,
    t,
    setLocale,
    languages,
  };

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


