import React, { createContext, useContext, useState } from 'react';

type Language = 'id' | 'en';

interface Translations {
  home: string;
  tvSeries: string;
  movies: string;
  anime: string;
  myList: string;
  search: string;
  login: string;
  logout: string;
  topAiring: string;
  mostPopular: string;
  mostFavorite: string;
  latestCompleted: string;
  play: string;
  details: string;
  episodes: string;
  comments: string;
  genre: string;
  status: string;
  duration: string;
  year: string;
  synopsis: string;
  noVideo: string;
  loading: string;
}

const translations: Record<Language, Translations> = {
  id: {
    home: 'Beranda',
    tvSeries: 'Serial Anime',
    movies: 'Film Anime',
    anime: 'Daftar Anime',
    myList: 'Daftar Saya',
    search: 'Cari anime...',
    login: 'Masuk',
    logout: 'Keluar',
    topAiring: 'Sedang Tayang (Top)',
    mostPopular: 'Paling Populer',
    mostFavorite: 'Film Anime Terbaik',
    latestCompleted: 'Baru Tamat',
    play: 'Putar',
    details: 'Detail',
    episodes: 'Episode',
    comments: 'Komentar',
    genre: 'Genre',
    status: 'Status',
    duration: 'Durasi',
    year: 'Tahun',
    synopsis: 'Sinopsis',
    noVideo: 'Video tidak tersedia',
    loading: 'Memuat data asli...'
  },
  en: {
    home: 'Home',
    tvSeries: 'Anime Series',
    movies: 'Anime Movies',
    anime: 'Anime List',
    myList: 'My List',
    search: 'Search anime...',
    login: 'Login',
    logout: 'Logout',
    topAiring: 'Top Airing',
    mostPopular: 'Most Popular',
    mostFavorite: 'Top Anime Movies',
    latestCompleted: 'Just Completed',
    play: 'Play',
    details: 'Details',
    episodes: 'Episodes',
    comments: 'Comments',
    genre: 'Genre',
    status: 'Status',
    duration: 'Duration',
    year: 'Year',
    synopsis: 'Synopsis',
    noVideo: 'Video not available',
    loading: 'Loading real data...'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('id');

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};