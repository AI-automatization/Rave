// CineSync Mobile — Movie Detail: Cast horizontal list
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import { ICastMember } from '@app-types/index';

interface MovieCastListProps {
  cast: ICastMember[];
  sectionTitle: string;
}

export const MovieCastList = React.memo<MovieCastListProps>(({ cast, sectionTitle }) => {
  const { colors } = useTheme();
  const styles = useStyles();

  if (!cast || cast.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.castScroll}
      >
        {cast.map((actor: ICastMember, idx: number) => (
          <View key={idx} style={styles.castItem}>
            {actor.photoUrl ? (
              <Image
                source={{ uri: actor.photoUrl }}
                style={styles.castAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.castAvatar, styles.castAvatarFallback]}>
                <Ionicons name="person" size={24} color={colors.textMuted} />
              </View>
            )}
            <Text style={styles.castName} numberOfLines={2}>{actor.name}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

MovieCastList.displayName = 'MovieCastList';

const useStyles = createThemedStyles((colors) => ({
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.md },
  castScroll: { marginHorizontal: -spacing.xl, paddingHorizontal: spacing.xl },
  castItem: { alignItems: 'center', width: 72, marginRight: spacing.md },
  castAvatar: { width: 60, height: 60, borderRadius: 30 },
  castAvatarFallback: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castName: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
}));
