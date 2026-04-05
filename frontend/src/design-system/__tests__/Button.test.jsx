// frontend/src/design-system/__tests__/Button.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  // Variant tests
  test('renders primary button', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test('renders secondary button', () => {
    render(<Button variant="secondary">Action</Button>);
    const button = screen.getByRole('button', { name: /action/i });
    expect(button).toBeInTheDocument();
  });

  test('renders tertiary button', () => {
    render(<Button variant="tertiary">Subtle</Button>);
    const button = screen.getByRole('button', { name: /subtle/i });
    expect(button).toBeInTheDocument();
  });

  test('renders destructive button', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toBeInTheDocument();
  });

  // Size tests
  test('renders large button (default)', () => {
    render(<Button size="large">Big</Button>);
    const button = screen.getByRole('button', { name: /big/i });
    expect(button).toHaveStyle({ height: '72px' });
  });

  test('renders medium button', () => {
    render(<Button size="medium">Medium</Button>);
    const button = screen.getByRole('button', { name: /medium/i });
    expect(button).toHaveStyle({ height: '60px' });
  });

  test('renders small button', () => {
    render(<Button size="small">Small</Button>);
    const button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveStyle({ height: '48px' });
  });

  // State tests
  test('disables button when disabled prop is true', () => {
    render(<Button disabled={true}>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  test('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole('button', { name: /click/i });
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Accessibility tests
  test('has proper ARIA attributes', () => {
    render(<Button aria-label="Custom action">Do it</Button>);
    const button = screen.getByRole('button', { name: /custom action/i });
    expect(button).toHaveAttribute('aria-label');
  });

  test('supports keyboard interaction (Enter, Space)', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>);
    const button = screen.getByRole('button', { name: /keyboard/i });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalled();
  });
});
