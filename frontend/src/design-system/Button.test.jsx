import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeTruthy();
    expect(button.className).toContain('btn-primary');
    expect(button.className).toContain('btn-medium');
    expect(button.disabled).toBe(false);
  });

  it('should render a secondary button', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button.className).toContain('btn-secondary');
  });

  it('should render a small button', () => {
    render(<Button size="small">Small</Button>);
    const button = screen.getByRole('button', { name: /small/i });
    expect(button.className).toContain('btn-small');
  });

  it('should render a large button', () => {
    render(<Button size="large">Large</Button>);
    const button = screen.getByRole('button', { name: /large/i });
    expect(button.className).toContain('btn-large');
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    const button = screen.getByRole('button', { name: /clickable/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when the disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render children content', () => {
    render(<Button><span>Icon</span> and Text</Button>);
    const button = screen.getByRole('button');
    expect(screen.getByText('and Text')).toBeTruthy();
    expect(screen.getByText('Icon')).toBeTruthy();
  });
});
