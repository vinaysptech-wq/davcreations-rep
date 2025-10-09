import { render, screen } from '@testing-library/react';
import Header from '../components/Header';

test('renders header with logo and search input', () => {
  render(<Header />);
  expect(screen.getByAltText('Dav Creations Logo')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
});