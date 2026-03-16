import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input Component', () => {
  it('should render with a label and placeholder', () => {
    render(<Input label="Your Name" placeholder="Enter your name" />);
    
    const input = screen.getByLabelText('Your Name');
    expect(input).toBeTruthy();
    expect(input.placeholder).toBe('Enter your name');
  });

  it('should call onChange handler when text is entered', () => {
    const handleChange = vi.fn();
    render(<Input label="Test Input" value="" onChange={handleChange} />);
    
    const input = screen.getByLabelText('Test Input');
    fireEvent.change(input, { target: { value: 'testing' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should display an error message and set aria-invalid when error prop is provided', () => {
    const errorMessage = 'This field is required';
    render(<Input label="Error Input" error={errorMessage} />);
    
    const input = screen.getByLabelText('Error Input');
    const error = screen.getByText(errorMessage);

    expect(error).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
    expect(input.className).toContain('input-error');
  });

  it('should not display error message when error prop is null', () => {
    render(<Input label="No Error" error={null} />);
    
    const input = screen.getByLabelText('No Error');
    expect(screen.queryByRole('paragraph')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.getAttribute('aria-describedby')).toBe(null);
  });

  it('should be disabled when the disabled prop is true', () => {
    render(<Input label="Disabled Input" disabled />);
    
    const input = screen.getByLabelText('Disabled Input');
    expect(input.disabled).toBe(true);
  });

  it('should associate label with input correctly', () => {
    render(<Input label="Associated Label" />);
    const input = screen.getByLabelText('Associated Label');
    expect(input.id).toBe('input-associated-label');
  });
});
