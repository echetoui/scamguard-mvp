import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  test('renders elevated card (default)', () => {
    render(<Card variant="elevated"><p>Content</p></Card>);
    const content = screen.getByText('Content');
    expect(content).toBeInTheDocument();
  });

  test('renders outlined card', () => {
    render(<Card variant="outlined"><p>Outlined</p></Card>);
    const content = screen.getByText('Outlined');
    expect(content).toBeInTheDocument();
  });

  test('renders filled card', () => {
    render(<Card variant="filled"><p>Filled</p></Card>);
    const content = screen.getByText('Filled');
    expect(content).toBeInTheDocument();
  });

  test('has proper padding for senior accessibility', () => {
    const { container } = render(<Card><p>Test</p></Card>);
    const card = container.firstChild;
    expect(card).toHaveStyle({ padding: '20px' });
  });

  test('renders children correctly', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  test('applies correct border radius', () => {
    const { container } = render(<Card><div>Test</div></Card>);
    const card = container.firstChild;
    expect(card).toHaveStyle({ borderRadius: '12px' });
  });
});
