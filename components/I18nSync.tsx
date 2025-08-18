import React, { useEffect } from 'react';
import { useI18n } from '../i18n';
import { useUserData } from '../hooks/useUserData';

export default function I18nSync() {
  const { settings } = useUserData();
  const { locale, setLocale } = useI18n();

  useEffect(() => {
    if (settings?.language && settings.language !== locale) {
      setLocale(settings.language);
    }
  }, [settings?.language, locale]);

  return null;
}




