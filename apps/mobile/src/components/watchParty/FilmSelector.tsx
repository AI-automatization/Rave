// CineSync Mobile — FilmSelector component
// Film selection UI: catalog search or URL extraction
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { ExtractStatus } from '@components/watchParty/ExtractStatus';
import type { IMovie } from '@app-types/index';
import type { VideoExtractResult } from '@api/content.api';

interface FilmSelectorProps {
  filmMode: 'catalog' | 'url';
  onSwitchToCatalog: () => void;
  onSwitchToUrl: () => void;

  // Catalog mode
  selectedMovie: IMovie | null;
  onSelectMovie: (movie: IMovie) => void;
  onClearMovie: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searching: boolean;
  searchResults: IMovie[];

  // URL mode
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  isExtracting: boolean;
  extractResult: VideoExtractResult | null;
  fallbackMode: boolean;
}

export function FilmSelector({
  filmMode,
  onSwitchToCatalog,
  onSwitchToUrl,
  selectedMovie,
  onSelectMovie,
  onClearMovie,
  searchQuery,
  onSearchChange,
  searching,
  searchResults,
  videoUrl,
  onVideoUrlChange,
  isExtracting,
  extractResult,
  fallbackMode,
}: FilmSelectorProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.label}>VIDEO MANBASI</Text>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, filmMode === 'catalog' && styles.modeBtnActive]}
          onPress={onSwitchToCatalog}
        >
          <Ionicons
            name="film-outline"
            size={14}
            color={filmMode === 'catalog' ? colors.textPrimary : colors.textMuted}
          />
          <Text style={[styles.modeBtnText, filmMode === 'catalog' && styles.modeBtnTextActive]}>
            Katalogdan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, filmMode === 'url' && styles.modeBtnActive]}
          onPress={onSwitchToUrl}
        >
          <Ionicons
            name="link-outline"
            size={14}
            color={filmMode === 'url' ? colors.textPrimary : colors.textMuted}
          />
          <Text style={[styles.modeBtnText, filmMode === 'url' && styles.modeBtnTextActive]}>
            URL orqali
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {filmMode === 'catalog' ? (
        selectedMovie ? (
          <SelectedMovieCard movie={selectedMovie} onClear={onClearMovie} />
        ) : (
          <CatalogSearch
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searching={searching}
            searchResults={searchResults}
            onSelectMovie={onSelectMovie}
          />
        )
      ) : (
        <>
          <TextInput
            style={styles.input}
            value={videoUrl}
            onChangeText={onVideoUrlChange}
            placeholder="YouTube, HLS yoki to'g'ri link..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
          <ExtractStatus
            isExtracting={isExtracting}
            extractResult={extractResult}
            fallbackMode={fallbackMode}
          />
        </>
      )}
    </View>
  );
}

/* ── Sub-components ── */

function SelectedMovieCard({ movie, onClear }: { movie: IMovie; onClear: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.selectedMovie}>
      {movie.posterUrl ? (
        <Image source={{ uri: movie.posterUrl }} style={styles.moviePoster} />
      ) : null}
      <View style={styles.selectedMovieInfo}>
        <Text style={styles.selectedMovieTitle} numberOfLines={2}>
          {movie.title}
        </Text>
        <Text style={styles.selectedMovieMeta}>
          {movie.year} · {movie.genre[0]}
        </Text>
      </View>
      <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function CatalogSearch({
  searchQuery,
  onSearchChange,
  searching,
  searchResults,
  onSelectMovie,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searching: boolean;
  searchResults: IMovie[];
  onSelectMovie: (movie: IMovie) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Film nomini qidiring..."
          placeholderTextColor={colors.textMuted}
        />
        {searching && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
      {searchResults.map(movie => (
        <TouchableOpacity
          key={movie._id}
          style={styles.searchResult}
          onPress={() => onSelectMovie(movie)}
        >
          <Text style={styles.searchResultTitle} numberOfLines={1}>
            {movie.title}
          </Text>
          <Text style={styles.searchResultMeta}>
            {movie.year} · {movie.genre[0]}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );
}

/* ── Styles ── */

const useStyles = createThemedStyles((colors) => ({
  section: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textMuted },

  // Mode toggle
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeBtnText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  modeBtnTextActive: { color: colors.textPrimary },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  searchResult: {
    padding: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  searchResultTitle: { ...typography.body, color: colors.textPrimary },
  searchResultMeta: { ...typography.caption, color: colors.textMuted },

  // Selected movie
  selectedMovie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  moviePoster: {
    width: 40,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgSurface,
  },
  selectedMovieInfo: { flex: 1, gap: 2 },
  selectedMovieTitle: { ...typography.body, color: colors.textPrimary },
  selectedMovieMeta: { ...typography.caption, color: colors.textMuted },
  clearBtn: { padding: spacing.xs },

  // URL input
  input: {
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
