import React from 'react';
import { render, screen } from '@testing-library/react';
import { Section } from '../Section';

describe('Section Component', () => {
  test('renders with title', () => {
    render(
      <Section title="Security Status">
        <p>Content</p>
      </Section>
    );
    expect(screen.getByText('Security Status')).toBeInTheDocument();
  });

  test('renders with title and subtitle', () => {
    render(
      <Section
        title="Protection"
        subtitle="Your current level"
      >
        <p>Protected</p>
      </Section>
    );
    expect(screen.getByText('Protection')).toBeInTheDocument();
    expect(screen.getByText('Your current level')).toBeInTheDocument();
  });

  test('renders children correctly', () => {
    render(
      <Section title="About">
        <p>First child</p>
        <p>Second child</p>
      </Section>
    );
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
  });

  test('has senior-friendly padding', () => {
    const { container } = render(
      <Section title="Test">
        <div>Content</div>
      </Section>
    );
    const section = container.firstChild;
    expect(section).toHaveStyle({ padding: '24px' });
  });

  test('has proper gap between children', () => {
    const { container } = render(
      <Section title="Test">
        <div>Content</div>
      </Section>
    );
    const section = container.firstChild;
    expect(section).toHaveStyle({ gap: '16px' });
  });

  test('can render without title', () => {
    render(
      <Section>
        <p>No title</p>
      </Section>
    );
    expect(screen.getByText('No title')).toBeInTheDocument();
  });

  test('renders optional divider', () => {
    const { container } = render(
      <Section title="Test" showDivider={true}>
        <p>Content</p>
      </Section>
    );
    const divider = container.querySelector('hr');
    expect(divider).toBeInTheDocument();
  });
});
