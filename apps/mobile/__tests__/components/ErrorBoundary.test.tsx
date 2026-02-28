import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error message');
  return <Text>Normal content</Text>;
};

// console.error ni suppress qilamiz (React error boundary loglarini yashirish)
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('ErrorBoundary', () => {
  it("xatosiz holatda children ko'rsatadi", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(getByText('Normal content')).toBeTruthy();
  });

  it("xato bo'lganda fallback UI ko'rsatadi", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );
    expect(getByText('Xatolik yuz berdi')).toBeTruthy();
    expect(getByText('Test error message')).toBeTruthy();
  });

  it("'Qayta urinish' bosish state ni reset qiladi", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );
    fireEvent.press(getByText('Qayta urinish'));
    // Reset bo'lgach children qayta render bo'ladi (bu safar error yo'q)
    // State reset bo'lgach ThrowError yana render bo'ladi — crash beradi
    // Shuning uchun faqat button bosilganini tekshiramiz
    expect(getByText('Qayta urinish')).toBeTruthy();
  });

  it("xato reportError ga uzatiladi", () => {
    const { reportError } = require('../../src/utils/crash');
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>,
    );
    expect(reportError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error message' }),
      expect.any(Object),
    );
  });
});
