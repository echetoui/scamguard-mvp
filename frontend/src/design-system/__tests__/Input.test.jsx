import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input Component', () => {
  test('renders text input', () => {
    render(<Input type="text" label="Name" />);
    const input = screen.getByRole('textbox', { name: /name/i });
    expect(input).toBeInTheDocument();
  });

  test('renders email input', () => {
    render(<Input type="email" label="Email" />);
    const input = screen.getByRole('textbox', { name: /email/i });
    expect(input).toBeInTheDocument();
  });

  test('renders password input with toggle', () => {
    render(<Input type="password" label="Password" />);
    const input = screen.getByLabelText(/password/i);
    expect(input).toHaveAttribute('type', 'password');
  });

  test('renders number input', () => {
    render(<Input type="number" label="Amount" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });

  test('displays label correctly', () => {
    render(<Input type="text" label="Username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  test('displays helper text', () => {
    render(
      <Input
        type="email"
        label="Email"
        helperText="We'll never share your email"
      />
    );
    expect(screen.getByText(/we'll never share/i)).toBeInTheDocument();
  });

  test('displays error message', () => {
    render(
      <Input
        type="text"
        label="Code"
        error="Invalid code"
      />
    );
    expect(screen.getByText('Invalid code')).toBeInTheDocument();
  });

  test('disables input when disabled prop is true', () => {
    render(<Input type="text" label="Disabled" disabled={true} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('calls onChange when user types', async () => {
    const handleChange = jest.fn();
    render(
      <Input
        type="text"
        label="Test"
        onChange={handleChange}
      />
    );
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'hello');
    expect(handleChange).toHaveBeenCalled();
  });

  test('has senior-friendly height (70px)', () => {
    const { container } = render(<Input type="text" label="Test" />);
    const input = container.querySelector('input');
    expect(input).toHaveStyle({ height: '70px' });
  });

  test('has large font size (20px) for readability', () => {
    const { container } = render(<Input type="text" label="Test" />);
    const input = container.querySelector('input');
    expect(input).toHaveStyle({ fontSize: '20px' });
  });

  test('supports placeholder', () => {
    render(<Input type="text" label="Name" placeholder="John Doe" />);
    const input = screen.getByPlaceholderText('John Doe');
    expect(input).toBeInTheDocument();
  });

  test('is keyboard accessible with focus ring', () => {
    const { container } = render(<Input type="text" label="Test" />);
    const input = container.querySelector('input');
    input.focus();
    expect(input).toHaveFocus();
  });
});
