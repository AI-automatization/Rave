// WeWatch Mobile — SourcePickerScreen
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TextInput, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { MEDIA_SOURCES } from '@constants/mediaSources';
import { SourceCard } from '@components/watchParty/SourceCard';
import { useSourcePicker } from '@hooks/useSourcePicker';
import { useVideoSearch } from '@hooks/useVideoSearch';
import { s } from './SourcePickerScreen.styles';
import type { ModalStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';

type Nav = NativeStackNavigationProp<ModalStackParamList>;

export function SourcePickerScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const [query, setQuery] = useState('');
  const { params, urlInput, isExtracting, urlError, handleSourcePress, handleUrlExtract, handleUrlChange, handleVideoResultPress } = useSourcePicker();

  // Real video search (YouTube / Rutube / VK) once the query is 2+ chars; debounced so each keystroke isn't a request.
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(id);
  }, [query]);
  const searching = debounced.length >= 2;
  const search = useVideoSearch(debounced);

  const filtered = useMemo(() => {
    if (!query.trim()) return MEDIA_SOURCES;
    const q = query.toLowerCase();
    return MEDIA_SOURCES.filter(
      src => src.label.toLowerCase().includes(q) || (src.sublabel ?? '').toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <LinearGradient colors={['#0A0A0F', '#0F0A1A', '#0A0A0F']} style={[s.root, { paddingTop: insets.top || 16 }]}>
      <View style={s.header}>
        <TrackedTouchable trackId="source_picker:back" onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TrackedTouchable>
        <Text style={s.title}>{t('sourcePicker', 'title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder={t('sourcePicker', 'searchPlaceholder')}
          placeholderTextColor="#6B7280"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TrackedTouchable trackId="source_picker:clear_search" onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </TrackedTouchable>
        )}
      </View>

      <View style={s.urlSection}>
        <Text style={s.urlLabel}>{t('sourcePicker', 'directLinkLabel')}</Text>
        <View style={s.urlRow}>
          <TextInput
            style={s.urlInput}
            placeholder="https://..."
            placeholderTextColor="#6B7280"
            value={urlInput}
            onChangeText={handleUrlChange}
            returnKeyType="go"
            onSubmitEditing={handleUrlExtract}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TrackedTouchable
            trackId="source_picker:extract_url"
            style={[s.urlBtn, (!urlInput.trim() || isExtracting) && s.urlBtnDisabled]}
            onPress={handleUrlExtract}
            disabled={!urlInput.trim() || isExtracting}
            activeOpacity={0.75}
          >
            {isExtracting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="arrow-forward" size={20} color="#fff" />
            }
          </TrackedTouchable>
        </View>
        {urlError ? <Text style={s.urlErrorText}>{urlError}</Text> : null}
      </View>

      {searching ? (
        <FlatList
          key="video-results"
          data={search.data ?? []}
          keyExtractor={(item) => item.url}
          contentContainerStyle={s.grid}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TrackedTouchable trackId="source_picker:video_result" style={s.resultRow} onPress={() => handleVideoResultPress(item)} activeOpacity={0.8}>
              {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={s.resultThumb} /> : <View style={s.resultThumb} />}
              <View style={s.resultInfo}>
                <Text style={s.resultTitle} numberOfLines={2}>{item.title}</Text>
                <View style={s.resultBadge}><Text style={s.resultBadgeText}>{item.platform.toUpperCase()}</Text></View>
              </View>
            </TrackedTouchable>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              {search.isLoading || search.isFetching ? (
                <>
                  <ActivityIndicator color="#7B72F8" />
                  <Text style={s.emptyText}>{t('sourcePicker', 'searchingVideos')}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search-outline" size={40} color="#4B5563" />
                  <Text style={s.emptyText}>{search.isError ? t('sourcePicker', 'searchError') : t('sourcePicker', 'nothingFound')}</Text>
                </>
              )}
            </View>
          }
        />
      ) : (
      <FlatList
        key="source-grid"
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <SourceCard source={item} onPress={handleSourcePress} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="search-outline" size={40} color="#4B5563" />
            <Text style={s.emptyText}>{t('sourcePicker', 'nothingFound')}</Text>
          </View>
        }
      />
      )}
    </LinearGradient>
  );
}
