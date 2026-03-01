import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MovieCard from '../../src/components/MovieCard';
import type { IMovie } from '../../src/types/index';

const mockMovie: IMovie = {
  _id: 'movie-1',
  title: 'Inception',
  originalTitle: 'Inception',
  description: 'A thief who steals corporate secrets.',
  type: 'movie',
  genre: ['action', 'sci-fi'],
  year: 2010,
  duration: 148,
  rating: 8.8,
  posterUrl: 'https://example.com/poster.jpg',
  backdropUrl: 'https://example.com/backdrop.jpg',
  videoUrl: 'https://example.com/video.m3u8',
  trailerUrl: 'https://example.com/trailer.mp4',
  isPublished: true,
  viewCount: 10000,
  addedBy: 'admin',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('MovieCard', () => {
  it("film nomini ko'rsatadi", () => {
    const { getByText } = render(<MovieCard movie={mockMovie} onPress={jest.fn()} />);
    expect(getByText('Inception')).toBeTruthy();
  });

  it("film yilini ko'rsatadi", () => {
    const { getByText } = render(<MovieCard movie={mockMovie} onPress={jest.fn()} />);
    expect(getByText('2010')).toBeTruthy();
  });

  it("reyting ko'rsatadi", () => {
    const { getByText } = render(<MovieCard movie={mockMovie} onPress={jest.fn()} />);
    expect(getByText('⭐ 8.8')).toBeTruthy();
  });

  it('bosilganda onPress chaqiriladi', () => {
    const onPressMock = jest.fn();
    const { getByRole } = render(<MovieCard movie={mockMovie} onPress={onPressMock} />);
    fireEvent.press(getByRole('button'));
    expect(onPressMock).toHaveBeenCalledWith(mockMovie);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('accessibilityLabel to\'g\'ri', () => {
    const { getByRole } = render(<MovieCard movie={mockMovie} onPress={jest.fn()} />);
    const btn = getByRole('button');
    expect(btn.props.accessibilityLabel).toBe('Inception, 2010, reyting 8.8');
  });
});
