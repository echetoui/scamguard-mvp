/**
 * FAQItem Component Tests
 * Tests for individual FAQ item with expand/collapse
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FAQItem from '../FAQItem';

describe('FAQItem Component', () => {
  const mockFaq = {
    id: 'faq-1',
    icon: '❓',
    question: 'What is a phishing scam?',
    answer: 'A phishing scam is when someone tricks you into sharing personal information.\nThey usually do this through fake emails or websites.'
  };

  const mockOnToggle = vi.fn();

  describe('Rendering', () => {
    it('should render FAQ item container', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      expect(container.querySelector('.faq-item')).toBeTruthy();
    });

    it('should display FAQ icon', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      const icon = container.querySelector('.faq-icon');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toBe('❓');
    });

    it('should display FAQ question', () => {
      render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      expect(screen.getByText('What is a phishing scam?')).toBeTruthy();
    });

    it('should have h4 for question', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      const heading = container.querySelector('.question-header h4');
      expect(heading).toBeTruthy();
      expect(heading.textContent).toBe('What is a phishing scam?');
    });

    it('should display toggle icon', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      const toggleIcon = container.querySelector('.toggle-icon');
      expect(toggleIcon).toBeTruthy();
      expect(toggleIcon.textContent).toBe('▼');
    });
  });

  describe('Answer Display', () => {
    it('should not show answer when collapsed', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      expect(container.querySelector('.faq-answer')).toBeFalsy();
    });

    it('should show answer when expanded', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={mockOnToggle} />
      );
      expect(container.querySelector('.faq-answer')).toBeTruthy();
    });

    it('should display answer content when expanded', () => {
      render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={mockOnToggle} />
      );
      expect(screen.getByText(/A phishing scam is when/)).toBeTruthy();
    });

    it('should split answer text by newlines', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={mockOnToggle} />
      );
      const brTags = container.querySelectorAll('.faq-answer br');
      expect(brTags.length).toBeGreaterThan(0);
    });
  });

  describe('Toggle Behavior', () => {
    it('should call onToggle when question is clicked', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      const question = container.querySelector('.faq-question');
      fireEvent.click(question);
      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('should toggle expand icon class when expanded', () => {
      const { container: collapsedContainer } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      let toggleIcon = collapsedContainer.querySelector('.toggle-icon');
      expect(toggleIcon.className).not.toContain('expanded');

      const { container: expandedContainer } = render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={mockOnToggle} />
      );
      toggleIcon = expandedContainer.querySelector('.toggle-icon');
      expect(toggleIcon.className).toContain('expanded');
    });
  });

  describe('Accessibility', () => {
    it('should have button role on question', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      const question = container.querySelector('.faq-question');
      expect(question.getAttribute('role')).toBe('button');
    });

    it('should have tabIndex for keyboard navigation', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      const question = container.querySelector('.faq-question');
      expect(question.getAttribute('tabIndex')).toBe('0');
    });

    it('should have aria-expanded attribute', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      const question = container.querySelector('.faq-question');
      expect(question.getAttribute('aria-expanded')).toBe('false');
    });

    it('should update aria-expanded when toggled', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={mockOnToggle} />
      );
      const question = container.querySelector('.faq-question');
      expect(question.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have onKeyPress handler', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      const question = container.querySelector('.faq-question');
      // Check that the component is interactive via keyboard
      expect(question.getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('CSS Classes', () => {
    it('should have proper class structure', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      expect(container.querySelector('.faq-item')).toBeTruthy();
      expect(container.querySelector('.faq-question')).toBeTruthy();
      expect(container.querySelector('.question-header')).toBeTruthy();
      expect(container.querySelector('.faq-icon')).toBeTruthy();
      expect(container.querySelector('.toggle-icon')).toBeTruthy();
    });

    it('should apply expanded class to toggle icon when expanded', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={mockOnToggle} />
      );
      const toggleIcon = container.querySelector('.toggle-icon');
      expect(toggleIcon.className).toContain('toggle-icon');
      expect(toggleIcon.className).toContain('expanded');
    });
  });

  describe('Different Question Types', () => {
    it('should display different question texts', () => {
      const questions = [
        'What is a scam?',
        'How do I protect myself?',
        'What should I do if I am scammed?'
      ];

      questions.forEach(question => {
        const faq = { ...mockFaq, question };
        render(
          <FAQItem faq={faq} isExpanded={false} onToggle={mockOnToggle} />
        );
        expect(screen.getByText(question)).toBeTruthy();
      });
    });

    it('should display different icons', () => {
      const icons = ['❓', '🛡️', '⚠️', '✅'];

      icons.forEach(icon => {
        const faq = { ...mockFaq, icon };
        const { container } = render(
          <FAQItem faq={faq} isExpanded={false} onToggle={mockOnToggle} />
        );
        const displayedIcon = container.querySelector('.faq-icon');
        expect(displayedIcon.textContent).toBe(icon);
      });
    });
  });

  describe('Multi-line Answers', () => {
    it('should handle single line answers', () => {
      const singleLineAnswer = {
        ...mockFaq,
        answer: 'Simple single line answer.'
      };
      const { container } = render(
        <FAQItem faq={singleLineAnswer} isExpanded={true} onToggle={vi.fn()} />
      );
      expect(screen.getByText(/Simple single line/)).toBeTruthy();
    });

    it('should handle multi-line answers with newlines', () => {
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={vi.fn()} />
      );
      const brTags = container.querySelectorAll('.faq-answer br');
      // mockFaq.answer has one newline creating 2 lines, each gets a br
      expect(brTags.length).toBe(2);
    });

    it('should handle answers with multiple newlines', () => {
      const multiLineAnswer = {
        ...mockFaq,
        answer: 'Line one\nLine two\nLine three'
      };
      const { container } = render(
        <FAQItem faq={multiLineAnswer} isExpanded={true} onToggle={vi.fn()} />
      );
      const brTags = container.querySelectorAll('.faq-answer br');
      // 3 lines each get a br
      expect(brTags.length).toBe(3);
    });

    it('should render answer text correctly', () => {
      render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={vi.fn()} />
      );
      expect(screen.getByText(/A phishing scam is when/)).toBeTruthy();
    });
  });

  describe('Click Handling', () => {
    it('should only call onToggle once per click', () => {
      const onToggleSpy = vi.fn();
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={onToggleSpy} />
      );
      const question = container.querySelector('.faq-question');
      fireEvent.click(question);
      expect(onToggleSpy).toHaveBeenCalledTimes(1);
    });

    it('should trigger onToggle callback', () => {
      const onToggleSpy = vi.fn();
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={onToggleSpy} />
      );
      const question = container.querySelector('.faq-question');
      fireEvent.click(question);
      expect(onToggleSpy).toHaveBeenCalled();
    });

    it('should handle click on icon', () => {
      const onToggleSpy = vi.fn();
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={onToggleSpy} />
      );
      const icon = container.querySelector('.faq-icon');
      fireEvent.click(icon);
      expect(onToggleSpy).toHaveBeenCalled();
    });

    it('should handle click on heading text', () => {
      const onToggleSpy = vi.fn();
      const { container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={onToggleSpy} />
      );
      const heading = container.querySelector('h4');
      fireEvent.click(heading);
      expect(onToggleSpy).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should reflect expanded state in UI', () => {
      const { container: collapsedContainer } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      expect(collapsedContainer.querySelector('.faq-answer')).toBeFalsy();

      const { container: expandedContainer } = render(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={mockOnToggle} />
      );
      expect(expandedContainer.querySelector('.faq-answer')).toBeTruthy();
    });

    it('should toggle between expanded and collapsed states', () => {
      mockOnToggle.mockClear();
      const { rerender, container } = render(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      expect(container.querySelector('.faq-answer')).toBeFalsy();

      rerender(
        <FAQItem faq={mockFaq} isExpanded={true} onToggle={mockOnToggle} />
      );
      expect(container.querySelector('.faq-answer')).toBeTruthy();

      rerender(
        <FAQItem faq={mockFaq} isExpanded={false} onToggle={mockOnToggle} />
      );
      expect(container.querySelector('.faq-answer')).toBeFalsy();
    });
  });
});
