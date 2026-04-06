/**
 * SMSMessage Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SMSMessage from './SMSMessage';

describe('SMSMessage Component', () => {
  it('renders SMS message with scam verdict', () => {
    render(
      <SMSMessage
        verdict="scam"
        message="Verify your account: bit.ly/verify123"
        sender="+1234567890"
      />
    );
    expect(screen.getByText('Scam Detected')).toBeInTheDocument();
    expect(screen.getByText(/Verify your account/)).toBeInTheDocument();
  });

  it('renders SMS message with legitimate verdict', () => {
    render(
      <SMSMessage
        verdict="legitimate"
        message="Your appointment is confirmed for tomorrow"
        sender="Dr. Smith's Office"
      />
    );
    expect(screen.getByText('Legitimate')).toBeInTheDocument();
  });

  it('renders SMS message with suspicious verdict', () => {
    render(
      <SMSMessage
        verdict="suspicious"
        message="Confirm your payment details"
        sender="Bank"
      />
    );
    expect(screen.getByText('Suspicious')).toBeInTheDocument();
  });

  it('displays sender information when provided', () => {
    render(
      <SMSMessage
        verdict="legitimate"
        message="Test message"
        sender="Test Sender"
      />
    );
    expect(screen.getByText(/Test Sender/)).toBeInTheDocument();
  });

  it('does not display sender when not provided', () => {
    render(
      <SMSMessage
        verdict="legitimate"
        message="Test message"
      />
    );
    expect(screen.queryByText(/From:/)).not.toBeInTheDocument();
  });

  it('renders report button when onReport callback provided', () => {
    const mockOnReport = vi.fn();
    render(
      <SMSMessage
        verdict="scam"
        message="Test message"
        onReport={mockOnReport}
      />
    );
    const button = screen.getByRole('button', { name: /Report/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onReport callback when report button clicked', () => {
    const mockOnReport = vi.fn();
    render(
      <SMSMessage
        verdict="scam"
        message="Test message"
        onReport={mockOnReport}
      />
    );
    const button = screen.getByRole('button', { name: /Report/i });
    fireEvent.click(button);
    expect(mockOnReport).toHaveBeenCalledOnce();
  });

  it('has proper accessibility aria label', () => {
    render(
      <SMSMessage
        verdict="scam"
        message="Test scam message"
      />
    );
    expect(screen.getByRole('article').getAttribute('aria-label')).toContain(
      'Test scam message'
    );
  });

  it('defaults to suspicious verdict when not specified', () => {
    render(
      <SMSMessage message="Test message" />
    );
    expect(screen.getByText('Suspicious')).toBeInTheDocument();
  });
});
