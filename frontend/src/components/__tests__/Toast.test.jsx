/**
 * Toast Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Different toast types (success, error, info, warning)
 * - Auto-dismiss functionality
 * - Accessibility attributes
 * - Message display
 * - Icon display
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Toast from '../Toast';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  describe('Toast Rendering', () => {
    it('should render toast container', () => {
      const { container } = render(
        <Toast message="Test message" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast')).toBeTruthy();
    });

    it('should display message text', () => {
      render(
        <Toast message="Test message" onClose={mockOnClose} />
      );

      expect(screen.getByText('Test message')).toBeTruthy();
    });

    it('should have alert role', () => {
      const { container } = render(
        <Toast message="Test message" onClose={mockOnClose} />
      );

      const toast = container.querySelector('[role="alert"]');
      expect(toast).toBeTruthy();
    });

    it('should have aria-live polite', () => {
      const { container } = render(
        <Toast message="Test message" onClose={mockOnClose} />
      );

      const toast = container.querySelector('[aria-live="polite"]');
      expect(toast).toBeTruthy();
    });

    it('should have aria-atomic true', () => {
      const { container } = render(
        <Toast message="Test message" onClose={mockOnClose} />
      );

      const toast = container.querySelector('[aria-atomic="true"]');
      expect(toast).toBeTruthy();
    });
  });

  describe('Toast Types', () => {
    it('should render success toast with correct class', () => {
      const { container } = render(
        <Toast message="Success" type="success" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast-success')).toBeTruthy();
    });

    it('should render error toast with correct class', () => {
      const { container } = render(
        <Toast message="Error" type="error" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast-error')).toBeTruthy();
    });

    it('should render info toast with correct class', () => {
      const { container } = render(
        <Toast message="Info" type="info" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast-info')).toBeTruthy();
    });

    it('should render warning toast with correct class', () => {
      const { container } = render(
        <Toast message="Warning" type="warning" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast-warning')).toBeTruthy();
    });

    it('should default to success type', () => {
      const { container } = render(
        <Toast message="Default" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast-success')).toBeTruthy();
    });
  });

  describe('Toast Icons', () => {
    it('should display success icon', () => {
      render(
        <Toast message="Success" type="success" onClose={mockOnClose} />
      );

      expect(screen.getByText('✅')).toBeTruthy();
    });

    it('should display error icon', () => {
      render(
        <Toast message="Error" type="error" onClose={mockOnClose} />
      );

      expect(screen.getByText('❌')).toBeTruthy();
    });

    it('should display info icon', () => {
      render(
        <Toast message="Info" type="info" onClose={mockOnClose} />
      );

      expect(screen.getByText('ℹ️')).toBeTruthy();
    });

    it('should display warning icon', () => {
      render(
        <Toast message="Warning" type="warning" onClose={mockOnClose} />
      );

      expect(screen.getByText('⚠️')).toBeTruthy();
    });

    it('should hide icon from screen readers', () => {
      const { container } = render(
        <Toast message="Success" type="success" onClose={mockOnClose} />
      );

      const icon = container.querySelector('.toast-icon');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Auto-Dismiss', () => {
    it('should call onClose after default timeout', () => {
      render(
        <Toast message="Test" onClose={mockOnClose} />
      );

      expect(mockOnClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(3000);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should use custom autoClose timeout', () => {
      render(
        <Toast message="Test" onClose={mockOnClose} autoClose={5000} />
      );

      vi.advanceTimersByTime(4000);
      expect(mockOnClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not auto-close when autoClose is false', () => {
      render(
        <Toast message="Test" onClose={mockOnClose} autoClose={false} />
      );

      vi.advanceTimersByTime(10000);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clear timeout on unmount', () => {
      const { unmount } = render(
        <Toast message="Test" onClose={mockOnClose} />
      );

      unmount();

      vi.advanceTimersByTime(3000);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should treat zero timeout as no auto-close (falsy value)', () => {
      render(
        <Toast message="Test" onClose={mockOnClose} autoClose={0} />
      );

      vi.runAllTimers();

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Message Display', () => {
    it('should display long message', () => {
      const longMessage = 'This is a very long toast message that should display correctly';
      render(
        <Toast message={longMessage} onClose={mockOnClose} />
      );

      expect(screen.getByText(longMessage)).toBeTruthy();
    });

    it('should display message with special characters', () => {
      const message = 'Error: "Invalid & Special < > Characters"';
      render(
        <Toast message={message} onClose={mockOnClose} />
      );

      expect(screen.getByText(/Invalid/)).toBeTruthy();
    });

    it('should have toast-message class', () => {
      const { container } = render(
        <Toast message="Test" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast-message')).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    it('should accept all valid props', () => {
      const { container } = render(
        <Toast
          message="Complete message"
          type="warning"
          onClose={mockOnClose}
          autoClose={2000}
        />
      );

      expect(container.querySelector('.toast')).toBeTruthy();
      expect(screen.getByText('Complete message')).toBeTruthy();
      expect(screen.getByText('⚠️')).toBeTruthy();
    });

    it('should handle undefined autoClose', () => {
      const { container } = render(
        <Toast message="Test" onClose={mockOnClose} autoClose={undefined} />
      );

      expect(container.querySelector('.toast')).toBeTruthy();
    });

    it('should handle null message gracefully', () => {
      const { container } = render(
        <Toast message={null} onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should render empty message', () => {
      const { container } = render(
        <Toast message="" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast')).toBeTruthy();
    });

    it('should render with special emoji message', () => {
      const message = '🎉 Congratulations! 🎊';
      render(
        <Toast message={message} onClose={mockOnClose} />
      );

      expect(screen.getByText(message)).toBeTruthy();
    });

    it('should handle rapid mount/unmount', () => {
      const { unmount } = render(
        <Toast message="Quick" onClose={mockOnClose} autoClose={3000} />
      );

      unmount();

      render(
        <Toast message="Quick 2" onClose={mockOnClose} autoClose={3000} />
      );

      vi.advanceTimersByTime(3000);

      expect(screen.getByText('Quick 2')).toBeTruthy();
    });

    it('should handle invalid type gracefully', () => {
      const { container } = render(
        <Toast message="Test" type="invalid" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be announced by screen readers', () => {
      const { container } = render(
        <Toast message="Important announcement" type="info" onClose={mockOnClose} />
      );

      const toast = container.querySelector('[role="alert"]');
      expect(toast.getAttribute('aria-live')).toBe('polite');
      expect(toast.getAttribute('aria-atomic')).toBe('true');
    });

    it('should have semantic structure', () => {
      const { container } = render(
        <Toast message="Test message" type="success" onClose={mockOnClose} />
      );

      expect(container.querySelector('.toast-icon')).toBeTruthy();
      expect(container.querySelector('.toast-message')).toBeTruthy();
    });

    it('should hide decorative icon from accessibility tree', () => {
      const { container } = render(
        <Toast message="Test" type="success" onClose={mockOnClose} />
      );

      const icon = container.querySelector('.toast-icon');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
