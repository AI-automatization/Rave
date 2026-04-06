// CineSync Mobile — SourcePickerScreen
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MEDIA_SOURCES } from '@constants/mediaSources';
import { SourceCard } from '@components/watchParty/SourceCard';
import { useSourcePicker } from '@hooks/useSourcePicker';
import { s } from './SourcePickerScreen.styles';
import type { ModalStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<ModalStackParamList>;

export function SourcePickerScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { params, urlInput, isExtracting, urlError, handleSourcePress, handleUrlExtract, handleCreateRoom, handleUrlChange } = useSourcePicker();

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>Выберите источник</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Искать видео, сериал или фильм..."
          placeholderTextColor="#6B7280"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.urlSection}>
        <Text style={s.urlLabel}>Или вставьте прямую ссылку на видео</Text>
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
          <TouchableOpacity
            style={[s.urlBtn, (!urlInput.trim() || isExtracting) && s.urlBtnDisabled]}
            onPress={handleUrlExtract}
            disabled={!urlInput.trim() || isExtracting}
            activeOpacity={0.75}
          >
            {isExtracting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="arrow-forward" size={20} color="#fff" />
            }
          </TouchableOpacity>
        </View>
        {urlError ? <Text style={s.urlErrorText}>{urlError}</Text> : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={s.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <SourceCard source={item} onPress={handleSourcePress} />}
        ListFooterComponent={
          params.context === 'new_room' ? (
            <TouchableOpacity style={s.createRoomBtn} onPress={handleCreateRoom}>
              <Ionicons name="people-outline" size={18} color="#E50914" />
              <Text style={s.createRoomText}>Создать комнату без медиа</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="search-outline" size={40} color="#4B5563" />
            <Text style={s.emptyText}>Ничего не найдено</Text>
          </View>
        }
      />
    </LinearGradient>
  );
}
