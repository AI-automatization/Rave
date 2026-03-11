// CineSync Mobile — ErrorBoundary unit test
import React from 'react';
import { act, create } from 'react-test-renderer';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Component that throws on demand
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test render error');
  return null;
}

// Suppress console.error for expected throws
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders nothing when no error', () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>,
      );
    });
    // Children render normally (ThrowingComponent returns null)
    expect(renderer!.toJSON()).toBeNull();
  });

  it('shows error UI when child throws', () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      );
    });
    // Error boundary renders the fallback View (not null)
    expect(renderer!.toJSON()).not.toBeNull();
  });

  it('shows custom fallback when provided', () => {
    const Fallback = () => null;
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ErrorBoundary fallback={<Fallback />}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      );
    });
    // Custom fallback (null component) renders instead of default error UI
    expect(renderer!.toJSON()).toBeNull();
  });

  it('handleRetry resets hasError state', () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>,
      );
    });

    const instance = renderer!.getInstance() as InstanceType<typeof ErrorBoundary>;
    // Manually set error state
    act(() => {
      instance.setState({ hasError: true, error: new Error('manual') });
    });
    expect(instance.state.hasError).toBe(true);

    // handleRetry resets it
    act(() => {
      instance.handleRetry();
    });
    expect(instance.state.hasError).toBe(false);
  });
});
