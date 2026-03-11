/**
 * StepCard Component Tests
 * Tests for individual step display in guides
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import StepCard from '../StepCard';

describe('StepCard Component', () => {
  const mockStep = {
    number: 1,
    instruction: 'Open the application',
    details: 'Click the app icon to launch it'
  };

  describe('Rendering', () => {
    it('should render step card container', () => {
      const { container } = render(<StepCard step={mockStep} />);
      expect(container.querySelector('.step-card')).toBeTruthy();
    });

    it('should display step number', () => {
      const { container } = render(<StepCard step={mockStep} />);
      const stepNumber = container.querySelector('.step-number');
      expect(stepNumber).toBeTruthy();
      expect(stepNumber.textContent).toBe('1');
    });

    it('should display step instruction', () => {
      render(<StepCard step={mockStep} />);
      expect(screen.getByText('Open the application')).toBeTruthy();
    });

    it('should display step details when provided', () => {
      render(<StepCard step={mockStep} />);
      expect(screen.getByText('Click the app icon to launch it')).toBeTruthy();
    });

    it('should have step content section', () => {
      const { container } = render(<StepCard step={mockStep} />);
      expect(container.querySelector('.step-content')).toBeTruthy();
    });
  });

  describe('Content Structure', () => {
    it('should have h6 heading for instruction', () => {
      const { container } = render(<StepCard step={mockStep} />);
      const heading = container.querySelector('.step-instruction');
      expect(heading).toBeTruthy();
      expect(heading.tagName).toBe('H6');
    });

    it('should contain instruction text', () => {
      const { container } = render(<StepCard step={mockStep} />);
      const instruction = container.querySelector('.step-instruction');
      expect(instruction.textContent).toContain('Open the application');
    });

    it('should have paragraph for details', () => {
      const { container } = render(<StepCard step={mockStep} />);
      const details = container.querySelector('.step-details');
      expect(details).toBeTruthy();
      expect(details.tagName).toBe('P');
    });
  });

  describe('Optional Details', () => {
    it('should not render details when not provided', () => {
      const stepWithoutDetails = {
        number: 1,
        instruction: 'Click button'
      };
      const { container } = render(<StepCard step={stepWithoutDetails} />);
      expect(container.querySelector('.step-details')).toBeFalsy();
    });

    it('should render details when provided', () => {
      render(<StepCard step={mockStep} />);
      expect(screen.getByText('Click the app icon to launch it')).toBeTruthy();
    });

    it('should not render empty details string', () => {
      const stepWithEmptyDetails = {
        number: 1,
        instruction: 'Do something',
        details: ''
      };
      const { container } = render(<StepCard step={stepWithEmptyDetails} />);
      const details = container.querySelector('.step-details');
      // Empty string is falsy, so conditional rendering won't show it
      expect(details).toBeFalsy();
    });
  });

  describe('Different Step Numbers', () => {
    it('should display different step numbers', () => {
      const steps = [1, 2, 5, 10];
      steps.forEach(num => {
        const { container } = render(
          <StepCard step={{ number: num, instruction: 'Test' }} />
        );
        const stepNumber = container.querySelector('.step-number');
        expect(stepNumber.textContent).toBe(num.toString());
      });
    });

    it('should handle numeric step numbers', () => {
      const { container } = render(
        <StepCard step={{ number: 42, instruction: 'Answer everything' }} />
      );
      const stepNumber = container.querySelector('.step-number');
      expect(stepNumber.textContent).toBe('42');
    });
  });

  describe('Content Variations', () => {
    it('should handle long instructions', () => {
      const longInstruction = 'This is a very long instruction that spans multiple words and contains detailed information about what needs to be done';
      const { container } = render(
        <StepCard step={{ number: 1, instruction: longInstruction }} />
      );
      const instruction = container.querySelector('.step-instruction');
      expect(instruction.textContent).toContain('very long instruction');
    });

    it('should handle special characters in instruction', () => {
      const specialInstruction = 'Enter your username & password (case-sensitive)';
      render(
        <StepCard step={{ number: 1, instruction: specialInstruction }} />
      );
      expect(screen.getByText('Enter your username & password (case-sensitive)')).toBeTruthy();
    });

    it('should handle special characters in details', () => {
      const specialDetails = 'Use @#$% for special characters';
      render(
        <StepCard step={{ number: 1, instruction: 'Test', details: specialDetails }} />
      );
      expect(screen.getByText('Use @#$% for special characters')).toBeTruthy();
    });
  });

  describe('CSS Classes', () => {
    it('should have all required CSS classes', () => {
      const { container } = render(<StepCard step={mockStep} />);
      expect(container.querySelector('.step-card')).toBeTruthy();
      expect(container.querySelector('.step-number')).toBeTruthy();
      expect(container.querySelector('.step-content')).toBeTruthy();
      expect(container.querySelector('.step-instruction')).toBeTruthy();
    });

    it('should apply CSS classes to details only when present', () => {
      const stepWithDetails = { number: 1, instruction: 'Do it', details: 'How to do it' };
      const { container: withDetails } = render(<StepCard step={stepWithDetails} />);
      expect(withDetails.querySelector('.step-details')).toBeTruthy();

      const stepWithoutDetails = { number: 1, instruction: 'Do it' };
      const { container: withoutDetails } = render(<StepCard step={stepWithoutDetails} />);
      expect(withoutDetails.querySelector('.step-details')).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading structure', () => {
      const { container } = render(<StepCard step={mockStep} />);
      const heading = container.querySelector('h6');
      expect(heading).toBeTruthy();
    });

    it('should be accessible without aria labels', () => {
      const { container } = render(<StepCard step={mockStep} />);
      const stepCard = container.querySelector('.step-card');
      expect(stepCard).toBeTruthy();
      // Component doesn't require extra ARIA since it's simple display
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple step cards correctly', () => {
      const steps = [
        { number: 1, instruction: 'First step' },
        { number: 2, instruction: 'Second step', details: 'Details about second' },
        { number: 3, instruction: 'Third step' }
      ];

      const { container } = render(
        <div>
          {steps.map(step => <StepCard key={step.number} step={step} />)}
        </div>
      );

      const stepCards = container.querySelectorAll('.step-card');
      expect(stepCards.length).toBe(3);
    });

    it('should maintain unique content in multiple instances', () => {
      const { container } = render(
        <div>
          <StepCard step={{ number: 1, instruction: 'Step one' }} />
          <StepCard step={{ number: 2, instruction: 'Step two', details: 'Details two' }} />
        </div>
      );

      const instructions = container.querySelectorAll('.step-instruction');
      expect(instructions[0].textContent).toBe('Step one');
      expect(instructions[1].textContent).toBe('Step two');
    });
  });

  describe('Edge Cases', () => {
    it('should handle step without details property', () => {
      const step = { number: 1, instruction: 'Do something' };
      const { container } = render(<StepCard step={step} />);
      expect(container.querySelector('.step-card')).toBeTruthy();
    });

    it('should handle step with null details', () => {
      const step = { number: 1, instruction: 'Do something', details: null };
      const { container } = render(<StepCard step={step} />);
      expect(container.querySelector('.step-details')).toBeFalsy();
    });

    it('should handle step with undefined details', () => {
      const step = { number: 1, instruction: 'Do something', details: undefined };
      const { container } = render(<StepCard step={step} />);
      expect(container.querySelector('.step-details')).toBeFalsy();
    });
  });
});
