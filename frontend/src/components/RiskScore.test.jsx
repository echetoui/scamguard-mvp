/**
 * RiskScore Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskScore from './RiskScore';

describe('RiskScore Component', () => {
  it('renders with safe level', () => {
    render(
      <RiskScore level="safe" score={15} label="Bank Login" />
    );
    expect(screen.getByText('Bank Login')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Low risk detected')).toBeInTheDocument();
  });

  it('renders with moderate level', () => {
    render(
      <RiskScore level="moderate" score={55} />
    );
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Caution advised')).toBeInTheDocument();
  });

  it('renders with danger level', () => {
    render(
      <RiskScore level="danger" score={92} />
    );
    expect(screen.getByText('Danger')).toBeInTheDocument();
    expect(screen.getByText('High risk')).toBeInTheDocument();
  });

  it('applies animated class when animated prop is true', () => {
    const { container } = render(
      <RiskScore level="safe" animated={true} />
    );
    expect(container.querySelector('.risk-score--animated')).toBeInTheDocument();
  });

  it('does not apply animated class when animated prop is false', () => {
    const { container } = render(
      <RiskScore level="safe" animated={false} />
    );
    expect(container.querySelector('.risk-score--animated')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<RiskScore level="danger" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders score percentage when provided', () => {
    render(<RiskScore level="safe" score={25} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('defaults to moderate level when not specified', () => {
    render(<RiskScore />);
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });
});
