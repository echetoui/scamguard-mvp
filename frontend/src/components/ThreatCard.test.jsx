/**
 * ThreatCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThreatCard from './ThreatCard';

describe('ThreatCard Component', () => {
  it('renders threat card with low severity', () => {
    render(
      <ThreatCard
        severity="low"
        title="Unusual Login"
        description="Login from unfamiliar location"
      />
    );
    expect(screen.getByText('Unusual Login')).toBeInTheDocument();
    expect(screen.getByText('Login from unfamiliar location')).toBeInTheDocument();
  });

  it('renders threat card with medium severity', () => {
    render(
      <ThreatCard
        severity="medium"
        title="Phishing Attempt"
        description="Email impersonating your bank"
      />
    );
    expect(screen.getByText('Phishing Attempt')).toBeInTheDocument();
  });

  it('renders threat card with danger severity', () => {
    render(
      <ThreatCard
        severity="danger"
        title="Malware Detected"
        description="Executable file with malicious signature"
      />
    );
    expect(screen.getByText('Malware Detected')).toBeInTheDocument();
  });

  it('renders action button when onAction callback provided', () => {
    const mockOnAction = vi.fn();
    render(
      <ThreatCard
        severity="danger"
        title="Test Threat"
        description="Test description"
        onAction={mockOnAction}
      />
    );
    const button = screen.getByRole('button', { name: /En savoir plus/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onAction callback when button clicked', () => {
    const mockOnAction = vi.fn();
    render(
      <ThreatCard
        severity="danger"
        title="Test Threat"
        description="Test description"
        onAction={mockOnAction}
      />
    );
    const button = screen.getByRole('button', { name: /En savoir plus/i });
    fireEvent.click(button);
    expect(mockOnAction).toHaveBeenCalledOnce();
  });

  it('does not render action button when onAction not provided', () => {
    render(
      <ThreatCard
        severity="low"
        title="Test Threat"
        description="Test description"
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders optional icon when provided', () => {
    render(
      <ThreatCard
        severity="low"
        title="Test Threat"
        description="Test description"
        icon="⚠️"
      />
    );
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('has proper accessibility aria label', () => {
    render(
      <ThreatCard
        severity="danger"
        title="Test Threat"
        description="Test description"
      />
    );
    const article = screen.getByRole('article');
    expect(article.getAttribute('aria-label')).toContain('Test Threat');
  });
});
