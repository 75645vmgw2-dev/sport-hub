import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, t as translate } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('fr');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const saved = await AsyncStorage.getItem('kazmo_language');
        if (saved && translations[saved]) {
          setLanguage(saved);
        }
      } catch(e) {}
      finally { setLoaded(true); }
    }
    loadLanguage();
  }, []);

  async function changeLanguage(code) {
    if (!translations[code]) return;
    setLanguage(code);
    try {
      await AsyncStorage.setItem('kazmo_language', code);
    } catch(e) {}
  }

  function t(key) {
    return translate(language, key);
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, loaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}