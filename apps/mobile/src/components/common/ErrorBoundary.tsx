// WeWatch Mobile — ErrorBoundary
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { captureError } from '@utils/errorLogger';
import { crash } from '@utils/crash';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallbackUI({ errorMessage, onRetry }: { errorMessage: string | null; onRetry: () => void }) {
  const { t } = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💥</Text>
      <Text style={styles.title}>{t('common', 'appError')}</Text>
      <Text style={styles.message}>{errorMessage ?? t('common', 'unknownError')}</Text>
      <TrackedTouchable trackId="error_boundary:retry" style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.retryText}>{t('common', 'retry')}</Text>
      </TrackedTouchable>
    </View>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // React error boundaries catch the error before it ever reaches Sentry's global
    // ErrorUtils handler (it never becomes "unhandled") — must forward explicitly or
    // render-time crashes silently skip Sentry entirely.
    captureError(error, { componentStack: info.componentStack ?? '' });
    crash.captureException(error, { componentStack: info.componentStack ?? '' });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallbackUI errorMessage={this.state.error?.message ?? null} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emoji: { fontSize: 48 },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  retryText: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
});
