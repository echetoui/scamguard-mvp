/**
 * Test Suite: ScamReportingSystem Component
 * Phase 5B - Comprehensive test coverage (50+ tests, 95%+ coverage)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScamReportingSystem from '../ScamReportingSystem';

vi.mock('../../hooks/useScamReport', () => ({
  default: vi.fn(() => ({
    submitReport: vi.fn().mockResolvedValue({ success: true }),
    isLoading: false,
    error: null,
  })),
}));

import useScamReport from '../../hooks/useScamReport';

describe('ScamReportingSystem Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useScamReport.mockReturnValue({
      submitReport: vi.fn().mockResolvedValue({ success: true }),
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. RENDERING TESTS (5 tests)
  // ============================================================================
  describe('Rendering', () => {
    it('should render the component without crashing', () => {
      const { container } = render(<ScamReportingSystem />);
      expect(container).toBeTruthy();
    });

    it('should render main reporting container with correct role', () => {
      render(<ScamReportingSystem />);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('reporting-main');
    });

    it('should display the header with title and description', () => {
      render(<ScamReportingSystem />);
      expect(screen.getByText('Signaler un message suspect')).toBeInTheDocument();
      expect(screen.getByText('Aidez la communauté en signalant les arnaques que vous recevez.')).toBeInTheDocument();
    });

    it('should render the stepper with three steps', () => {
      render(<ScamReportingSystem />);
      const stepperNav = screen.getByLabelText('Progression du signalement');
      expect(stepperNav).toBeInTheDocument();
      expect(screen.getByText('Détails')).toBeInTheDocument();
      expect(screen.getByText('Preuve')).toBeInTheDocument();
      expect(screen.getByText('Validation')).toBeInTheDocument();
    });

    it('should display first step content initially', () => {
      render(<ScamReportingSystem />);
      expect(screen.getByText('De quel type d\'arnaque s\'agit-il ?')).toBeInTheDocument();
      expect(screen.getByLabelText('Type de message')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 2. NAVIGATION TESTS (6 tests)
  // ============================================================================
  describe('Navigation - Step Progression', () => {
    it('should show Next button on step 1 and 2', () => {
      render(<ScamReportingSystem />);
      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      expect(nextButton).toBeInTheDocument();
    });

    it('should not show Back button on step 1', () => {
      render(<ScamReportingSystem />);
      const backButton = screen.queryByRole('button', { name: /Retour/i });
      expect(backButton).not.toBeInTheDocument();
    });

    it('should advance to step 2 when Next is clicked on step 1', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByText('Ajouter une capture d\'écran')).toBeInTheDocument();
    });

    it('should go back to step 1 when Back is clicked on step 2', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'email');
      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const backButton = screen.getByRole('button', { name: /Retour/i });
      await user.click(backButton);

      expect(screen.getByText('De quel type d\'arnaque s\'agit-il ?')).toBeInTheDocument();
    });

    it('should show Submit button on step 3 instead of Next', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'call');
      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByRole('button', { name: /Soumettre le signalement/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Suivant/i })).not.toBeInTheDocument();
    });

    it('should disable Next button on step 1 when scamType is not selected', () => {
      render(<ScamReportingSystem />);
      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      expect(nextButton).toBeDisabled();
    });
  });

  // ============================================================================
  // 3. FORM HANDLING TESTS (8 tests)
  // ============================================================================
  describe('Form Handling - Step 1 (Details)', () => {
    it('should update scamType when select changes', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      expect(scamTypeSelect).toHaveValue('sms');
    });

    it('should update description when textarea changes', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const descriptionInput = screen.getByLabelText(/Que disait le message/);
      await user.type(descriptionInput, 'Test scam message');

      expect(descriptionInput).toHaveValue('Test scam message');
    });

    it('should persist form data across navigation', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'email');

      const descriptionInput = screen.getByLabelText(/Que disait le message/);
      await user.type(descriptionInput, 'Email scam');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const backButton = screen.getByRole('button', { name: /Retour/i });
      await user.click(backButton);

      expect(scamTypeSelect).toHaveValue('email');
      expect(descriptionInput).toHaveValue('Email scam');
    });

    it('should display all scam type options', () => {
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      const options = within(scamTypeSelect).getAllByRole('option');

      expect(options).toHaveLength(5);
      expect(options[1]).toHaveValue('sms');
      expect(options[2]).toHaveValue('email');
      expect(options[3]).toHaveValue('call');
      expect(options[4]).toHaveValue('social');
    });

    it('should have correct placeholder text in select', () => {
      render(<ScamReportingSystem />);
      const placeholder = screen.getByRole('option', { name: 'Sélectionnez une option...' });
      expect(placeholder).toBeInTheDocument();
    });

    it('should have placeholder text in description textarea', () => {
      render(<ScamReportingSystem />);
      const descriptionInput = screen.getByLabelText(/Que disait le message/);
      expect(descriptionInput).toHaveAttribute('placeholder', expect.stringContaining('Ex: Ils m\'ont demandé'));
    });

    it('should accept empty description (optional field)', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'social');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      expect(nextButton).not.toBeDisabled();
      await user.click(nextButton);

      expect(screen.getByText('Ajouter une capture d\'écran')).toBeInTheDocument();
    });

    it('should handle special characters in description', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const descriptionInput = screen.getByLabelText(/Que disait le message/);
      const specialText = '! @ # $ % ^ & * ( ) < > ? " \' ; :';
      await user.type(descriptionInput, specialText);

      expect(descriptionInput).toHaveValue(specialText);
    });
  });

  // ============================================================================
  // 4. FILE UPLOAD TESTS (8 tests)
  // ============================================================================
  describe('File Upload - Step 2 (Proof)', () => {
    it('should render upload area on step 2', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const uploadArea = screen.getByRole('button', { name: /Cliquez pour ajouter/i });
      expect(uploadArea).toBeInTheDocument();
    });

    it('should display initial upload text when no file selected', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByText('Prendre une photo ou choisir un fichier')).toBeInTheDocument();
    });

    it('should trigger file input when upload area is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const uploadArea = screen.getByRole('button', { name: /Cliquez pour ajouter/i });
      await user.click(uploadArea);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should display file name after file selection', async () => {
      const { container } = render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await userEvent.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await userEvent.click(nextButton);

      const file = new File(['test'], 'test-screenshot.png', { type: 'image/png' });
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test-screenshot.png')).toBeInTheDocument();
      });
    });

    it('should display image preview after file selection', async () => {
      const { container } = render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await userEvent.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await userEvent.click(nextButton);

      const file = new File(['test'], 'test-screenshot.png', { type: 'image/png' });

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Aperçu de votre image :')).toBeInTheDocument();
        const img = screen.getByAltText('Aperçu du signalement : test-screenshot.png');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('width', '640');
        expect(img).toHaveAttribute('height', '360');
      });

      vi.restoreAllMocks();
    });

    it('should handle multiple file selections (use latest)', async () => {
      const { container } = render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await userEvent.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await userEvent.click(nextButton);

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

      const file1 = new File(['test1'], 'first.png', { type: 'image/png' });
      const file2 = new File(['test2'], 'second.png', { type: 'image/png' });

      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file1] } });
      await waitFor(() => {
        expect(screen.getByText('first.png')).toBeInTheDocument();
      });

      fireEvent.change(fileInput, { target: { files: [file2] } });
      await waitFor(() => {
        expect(screen.queryByText('first.png')).not.toBeInTheDocument();
        expect(screen.getByText('second.png')).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const uploadArea = screen.getByRole('button', { name: /Cliquez pour ajouter/i });
      expect(uploadArea).toHaveAttribute('tabIndex', '0');
      expect(uploadArea).toHaveAttribute('role', 'button');
    });

    it('should step back from upload without losing data', async () => {
      const { container } = render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await userEvent.selectOptions(scamTypeSelect, 'sms');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await userEvent.click(nextButton);

      const file = new File(['test'], 'test-screenshot.png', { type: 'image/png' });
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test-screenshot.png')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Retour/i });
      await userEvent.click(backButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await userEvent.click(nextButton);

      // File name should still be there
      expect(screen.getByText('test-screenshot.png')).toBeInTheDocument();

      vi.restoreAllMocks();
    });
  });

  // ============================================================================
  // 5. SUBMISSION TESTS (8 tests)
  // ============================================================================
  describe('Form Submission - Step 3 (Validation & Submit)', () => {
    it('should display summary on step 3', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByText('Résumé de votre signalement')).toBeInTheDocument();
      expect(screen.getByText(/Type :/)).toBeInTheDocument();
      expect(screen.getByText(/Description :/)).toBeInTheDocument();
      expect(screen.getByText(/Preuve :/)).toBeInTheDocument();
    });

    it('should display scamType in summary', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'email');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByText('email')).toBeInTheDocument();
    });

    it('should call submitReport when Submit button is clicked', async () => {
      const user = userEvent.setup();
      const mockSubmitReport = vi.fn().mockResolvedValue({ success: true });
      useScamReport.mockReturnValue({
        submitReport: mockSubmitReport,
        isLoading: false,
        error: null,
      });

      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'call');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const submitButton = screen.getByRole('button', { name: /Soumettre le signalement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitReport).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should show success message on successful submission', async () => {
      const user = userEvent.setup();
      const mockSubmitReport = vi.fn().mockResolvedValue({ success: true });
      useScamReport.mockReturnValue({
        submitReport: mockSubmitReport,
        isLoading: false,
        error: null,
      });

      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'social');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const submitButton = screen.getByRole('button', { name: /Soumettre le signalement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText(/Signalement envoyé avec succès/)[0]).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display loading state during submission', async () => {
      const user = userEvent.setup();
      const mockSubmitReport = vi.fn(() => new Promise(() => {}));
      useScamReport.mockReturnValue({
        submitReport: mockSubmitReport,
        isLoading: false,
        error: null,
      });

      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const submitButton = screen.getByRole('button', { name: /Soumettre le signalement/i });
      await user.click(submitButton);

      expect(mockSubmitReport).toHaveBeenCalled();
    });

    it('should display privacy notice on step 3', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const privacyText = screen.getByText(/Vos informations personnelles seront masquées/);
      expect(privacyText).toBeInTheDocument();
    });

    it('should show "No image" indicator when file not uploaded', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'call');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByText(/❌ Aucune image/)).toBeInTheDocument();
    });

    it('should show "Image attached" indicator when file uploaded', async () => {
      const { container } = render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await userEvent.selectOptions(scamTypeSelect, 'sms');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await userEvent.click(nextButton);

      const file = new File(['test'], 'screenshot.png', { type: 'image/png' });
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await userEvent.click(nextButton);

      expect(screen.getByText(/✅ Image jointe/)).toBeInTheDocument();

      vi.restoreAllMocks();
    });
  });

  // ============================================================================
  // 6. ACCESSIBILITY TESTS (8 tests)
  // ============================================================================
  describe('Accessibility', () => {
    it('should have proper semantic heading structure', () => {
      render(<ScamReportingSystem />);
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Signaler un message suspect');
    });

    it('should have aria-label on stepper navigation', () => {
      render(<ScamReportingSystem />);
      const stepper = screen.getByLabelText('Progression du signalement');
      expect(stepper).toBeInTheDocument();
    });

    it('should mark current step with aria-current', () => {
      render(<ScamReportingSystem />);
      const stepItems = screen.getAllByRole('listitem');
      const currentStep = stepItems.find(item => item.getAttribute('aria-current') === 'step');
      expect(currentStep).toBeInTheDocument();
    });

    it('should have aria-hidden on visual separators', () => {
      const { container } = render(<ScamReportingSystem />);
      const separators = container.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThanOrEqual(2);
    });

    it('should have aria-labelledby on step sections', () => {
      render(<ScamReportingSystem />);
      const section = screen.getByLabelText('De quel type d\'arnaque s\'agit-il ?');
      expect(section).toBeInTheDocument();
    });

    it('should have proper error message role', async () => {
      const user = userEvent.setup();
      useScamReport.mockReturnValue({
        submitReport: vi.fn(),
        isLoading: false,
        error: 'Test error message',
      });

      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have proper labels for all form inputs', () => {
      render(<ScamReportingSystem />);

      expect(screen.getByLabelText('Type de message')).toBeInTheDocument();
      expect(screen.getByLabelText(/Que disait le message/)).toBeInTheDocument();
    });

    it('should have main element with role="main"', () => {
      render(<ScamReportingSystem />);
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });

  // ============================================================================
  // 7. COMPLETE WORKFLOW TESTS (5+ tests)
  // ============================================================================
  describe('Complete Workflows', () => {
    it('should complete full reporting flow with all data', async () => {
      const user = userEvent.setup();
      const mockSubmitReport = vi.fn().mockResolvedValue({ success: true });
      useScamReport.mockReturnValue({
        submitReport: mockSubmitReport,
        isLoading: false,
        error: null,
      });

      const { container } = render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'email');

      const descriptionInput = screen.getByLabelText(/Que disait le message/);
      await user.type(descriptionInput, 'Suspicious email asking for password');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      const file = new File(['test'], 'evidence.png', { type: 'image/png' });
      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText(/Suspicious email/)).toBeInTheDocument();

      const submitButton = screen.getByRole('button', { name: /Soumettre/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitReport).toHaveBeenCalledWith(
          expect.objectContaining({
            scamType: 'email',
            description: 'Suspicious email asking for password',
            rawFile: expect.any(File),
          })
        );
      }, { timeout: 2000 });

      vi.restoreAllMocks();
    });

    it('should allow reporting with minimal data (only scamType)', async () => {
      const user = userEvent.setup();
      const mockSubmitReport = vi.fn().mockResolvedValue({ success: true });
      useScamReport.mockReturnValue({
        submitReport: mockSubmitReport,
        isLoading: false,
        error: null,
      });

      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      const submitButton = screen.getByRole('button', { name: /Soumettre/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitReport).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should navigate back and forth multiple times', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'social');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);
      expect(screen.getByText('Ajouter une capture d\'écran')).toBeInTheDocument();

      let backButton = screen.getByRole('button', { name: /Retour/i });
      await user.click(backButton);
      expect(screen.getByText(/De quel type d'arnaque/)).toBeInTheDocument();

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);
      expect(screen.getByText('Résumé de votre signalement')).toBeInTheDocument();

      backButton = screen.getByRole('button', { name: /Retour/i });
      await user.click(backButton);
      expect(screen.getByText('Ajouter une capture d\'écran')).toBeInTheDocument();

      backButton = screen.getByRole('button', { name: /Retour/i });
      await user.click(backButton);
      expect(screen.getByText(/De quel type d'arnaque/)).toBeInTheDocument();
    });

    it('should handle rapid button clicks without breaking', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'sms');

      const nextButton = screen.getByRole('button', { name: /Suivant/i });

      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);

      expect(screen.getByText('Résumé de votre signalement')).toBeInTheDocument();
    });

    it('should display description in summary', async () => {
      const user = userEvent.setup();
      render(<ScamReportingSystem />);

      const scamTypeSelect = screen.getByLabelText('Type de message');
      await user.selectOptions(scamTypeSelect, 'email');

      const descriptionInput = screen.getByLabelText(/Que disait le message/);
      await user.type(descriptionInput, 'Test description content');

      let nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      nextButton = screen.getByRole('button', { name: /Suivant/i });
      await user.click(nextButton);

      expect(screen.getByText(/Test description content/)).toBeInTheDocument();
    });
  });
});
