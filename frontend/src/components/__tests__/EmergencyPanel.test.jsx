import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmergencyPanel from '../EmergencyPanel';

describe('EmergencyPanel', () => {
  let originalLocation;

  beforeEach(() => {
    originalLocation = window.location;
    delete window.location;
    window.location = { href: '' };
    global.window.open = vi.fn();
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  it('renders title "Numéros d\'Urgence"', () => {
    render(<EmergencyPanel />);
    const title = screen.getByRole('heading', { name: /Numéros d'Urgence/i });
    expect(title).toBeInTheDocument();
  });

  it('displays 4 emergency contacts', () => {
    render(<EmergencyPanel />);
    const contacts = screen.getAllByRole('listitem');
    expect(contacts).toHaveLength(4);
  });

  it('displays 911 emergency number', () => {
    render(<EmergencyPanel />);
    const police911 = screen.getByText('911');
    expect(police911).toBeInTheDocument();
  });

  it('displays CAFC phone number', () => {
    render(<EmergencyPanel />);
    const cafcNumber = screen.getByText('1-888-495-8501');
    expect(cafcNumber).toBeInTheDocument();
  });

  it('displays AMF phone number', () => {
    render(<EmergencyPanel />);
    const amfNumber = screen.getByText('1-877-525-0337');
    expect(amfNumber).toBeInTheDocument();
  });

  it('uses tel: protocol when calling a number', () => {
    render(<EmergencyPanel />);

    // Find the button for 911
    const police911Button = screen.getByRole('button', { name: /Appeler Police au 911/i });

    // Click the button
    fireEvent.click(police911Button);

    // The tel: protocol should be used
    expect(window.location.href).toBe('tel:911');
  });

  it('opens CAFC online reporting link', () => {
    render(<EmergencyPanel />);
    const reportBtn = screen.getByRole('button', { name: /Signaler une fraude au Centre Antifraude/i });

    fireEvent.click(reportBtn);

    expect(global.window.open).toHaveBeenCalledWith(
      'https://www.antifraudcentre.ca/fr',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<EmergencyPanel onClose={mockOnClose} />);

    const closeBtn = screen.getByRole('button', { name: /Fermer/i });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('has proper accessibility with role="dialog" and aria-modal="true"', () => {
    render(<EmergencyPanel />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label');
    expect(dialog.getAttribute('aria-label')).toMatch(/Numéros d'Urgence/i);
  });
});
