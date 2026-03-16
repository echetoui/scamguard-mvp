import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card Component', () => {
  it('should render children content', () => {
    render(<Card><p>This is the card content.</p></Card>);
    expect(screen.getByText('This is the card content.')).toBeTruthy();
  });

  it('should render a title when provided', () => {
    render(<Card title="My Card"><p>Content</p></Card>);
    expect(screen.getByRole('heading', { name: /my card/i, level: 3 })).toBeTruthy();
  });

  it('should not render a title when not provided', () => {
    render(<Card><p>Content</p></Card>);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('should apply additional class names', () => {
    const { container } = render(<Card className="custom-class" />);
    expect(container.firstChild.classList.contains('custom-class')).toBe(true);
  });
});
