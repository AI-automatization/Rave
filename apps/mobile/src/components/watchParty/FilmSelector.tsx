// CineSync Mobile — FilmSelector component
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useFilmSelectorStyles } from './FilmSelector.styles';
import { ExtractStatus } from '@components/watchParty/ExtractStatus';
import type { IMovie } from '@app-types/index';
import type { VideoExtractResult } from '@api/content.api';

interface FilmSelectorProps {
  filmMode: 'catalog' | 'url';
  onSwitchToCatalog: () => void;
  onSwitchToUrl: () => void;
  selectedMovie: IMovie | null;
  onSelectMovie: (movie: IMovie) => void;
  onClearMovie: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searching: boolean;
  searchResults: IMovie[];
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  isExtracting: boolean;
  extractResult: VideoExtractResult | null;
  fallbackMode: boolean;
}

function SelectedMovieCard({ movie, onClear }: { movie: IMovie; onClear: () => void }) {
  const { colors } = useTheme();
  const s = useFilmSelectorStyles();
  return (
    <View style={s.selectedMovie}>
      {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={s.moviePoster} /> : null}
      <View style={s.selectedMovieInfo}>
        <Text style={s.selectedMovieTitle} numberOfLines={2}>{movie.title}</Text>
        <Text style={s.selectedMovieMeta}>{movie.year} · {movie.genre[0]}</Text>
      </View>
      <TouchableOpacity onPress={onClear} style={s.clearBtn}>
        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function CatalogSearch({ searchQuery, onSearchChange, searching, searchResults, onSelectMovie }: {
  searchQuery: string; onSearchChange: (q: string) => void;
  searching: boolean; searchResults: IMovie[]; onSelectMovie: (movie: IMovie) => void;
}) {
  const { colors } = useTheme();
  const s = useFilmSelectorStyles();
  return (
    <>
      <View style={s.searchBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput style={s.searchInput} value={searchQuery} onChangeText={onSearchChange}
          placeholder="Film nomini qidiring..." placeholderTextColor={colors.textMuted} />
        {searching && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
      {searchResults.map(movie => (
        <TouchableOpacity key={movie._id} style={s.searchResult} onPress={() => onSelectMovie(movie)}>
          <Text style={s.searchResultTitle} numberOfLines={1}>{movie.title}</Text>
          <Text style={s.searchResultMeta}>{movie.year} · {movie.genre[0]}</Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

export function FilmSelector({
  filmMode, onSwitchToCatalog, onSwitchToUrl, selectedMovie, onSelectMovie, onClearMovie,
  searchQuery, onSearchChange, searching, searchResults,
  videoUrl, onVideoUrlChange, isExtracting, extractResult, fallbackMode,
}: FilmSelectorProps) {
  const { colors } = useTheme();
  const s = useFilmSelectorStyles();
  return (
    <View style={s.section}>
      <Text style={s.label}>VIDEO MANBASI</Text>
      <View style={s.modeRow}>
        <TouchableOpacity style={[s.modeBtn, filmMode === 'catalog' && s.modeBtnActive]} onPress={onSwitchToCatalog}>
          <Ionicons name="film-outline" size={14} color={filmMode === 'catalog' ? colors.textPrimary : colors.textMuted} />
          <Text style={[s.modeBtnText, filmMode === 'catalog' && s.modeBtnTextActive]}>Katalogdan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.modeBtn, filmMode === 'url' && s.modeBtnActive]} onPress={onSwitchToUrl}>
          <Ionicons name="link-outline" size={14} color={filmMode === 'url' ? colors.textPrimary : colors.textMuted} />
          <Text style={[s.modeBtnText, filmMode === 'url' && s.modeBtnTextActive]}>URL orqali</Text>
        </TouchableOpacity>
      </View>
      {filmMode === 'catalog' ? (
        selectedMovie
          ? <SelectedMovieCard movie={selectedMovie} onClear={onClearMovie} />
          : <CatalogSearch searchQuery={searchQuery} onSearchChange={onSearchChange}
              searching={searching} searchResults={searchResults} onSelectMovie={onSelectMovie} />
      ) : (
        <>
          <TextInput style={s.input} value={videoUrl} onChangeText={onVideoUrlChange}
            placeholder="YouTube, HLS yoki to'g'ri link..."
            placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="url" />
          <ExtractStatus isExtracting={isExtracting} extractResult={extractResult} fallbackMode={fallbackMode} />
        </>
      )}
    </View>
  );
}
