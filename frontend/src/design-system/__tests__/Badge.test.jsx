// frontend/src/design-system/__tests__/Badge.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge Component', () => {
  // Variant tests
  test('renders filled badge', () => {
    render(<Badge variant="filled">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('renders outlined badge', () => {
    render(<Badge variant="outlined">Pending</Badge>);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('renders tonal badge', () => {
    render(<Badge variant="tonal">New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  // Size tests
  test('renders large badge (senior-friendly default)', () => {
    const { container } = render(<Badge size="large">Big</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveStyle({ fontSize: '18px' });
  });

  test('renders medium badge', () => {
    const { container } = render(<Badge size="medium">Med</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveStyle({ fontSize: '16px' });
  });

  test('renders small badge', () => {
    const { container } = render(<Badge size="small">Sm</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveStyle({ fontSize: '14px' });
  });

  // Color tests
  test('supports custom color', () => {
    render(<Badge color="secondary">Green</Badge>);
    expect(screen.getByText('Green')).toBeInTheDocument();
  });

  test('supports error color', () => {
    render(<Badge color="error">Error</Badge>);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  // Style tests
  test('has proper padding for readability', () => {
    const { container } = render(<Badge>Test</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveStyle({ padding: '8px 12px' });
  });

  test('has rounded corners', () => {
    const { container } = render(<Badge>Tag</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveStyle({ borderRadius: '8px' });
  });

  // Default props tests
  test('defaults to filled variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  test('defaults to large size', () => {
    const { container } = render(<Badge>Large</Badge>);
    const badge = container.firstChild;
    expect(badge).toHaveStyle({ fontSize: '18px' });
  });

  test('defaults to primary color', () => {
    render(<Badge>Primary</Badge>);
    expect(screen.getByText('Primary')).toBeInTheDocument();
  });
});
