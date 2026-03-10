/**
 * QuizModule Component Tests
 * Phase 6 - Coverage Expansion Continuation
 *
 * Tests for interactive quiz system with questions, answers, scoring, and results
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuizModule from '../QuizModule';

describe('QuizModule Component', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render quiz module container', () => {
      const { container } = render(<QuizModule />);

      expect(container.querySelector('.quiz-module')).toBeTruthy();
    });

    it('should display quiz title', () => {
      render(<QuizModule />);

      expect(screen.getByText(/Quiz Interactif/)).toBeTruthy();
    });

    it('should display first question', () => {
      render(<QuizModule />);

      expect(screen.getByText(/Vous recevez un SMS/)).toBeTruthy();
    });

    it('should show progress indicator', () => {
      const { container } = render(<QuizModule />);

      expect(screen.getByText(/Question 1\/5/)).toBeTruthy();
    });

    it('should display progress bar', () => {
      const { container } = render(<QuizModule />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeTruthy();
    });

    it('should display question category', () => {
      render(<QuizModule />);

      expect(screen.getByText('Phishing Bancaire')).toBeTruthy();
    });

    it('should display question difficulty', () => {
      render(<QuizModule />);

      expect(screen.getByText('Facile')).toBeTruthy();
    });
  });

  describe('Answer Options', () => {
    it('should display all three options for first question', () => {
      const { container } = render(<QuizModule />);

      const options = container.querySelectorAll('.option-item');
      expect(options.length).toBe(3);
    });

    it('should have radio input for each option', () => {
      const { container } = render(<QuizModule />);

      const radios = container.querySelectorAll('input[type="radio"]');
      expect(radios.length).toBe(3);
    });

    it('should display first option text', () => {
      render(<QuizModule />);

      expect(screen.getByText('Je clique le lien immédiatement')).toBeTruthy();
    });

    it('should display second option text', () => {
      render(<QuizModule />);

      expect(screen.getByText(/J\'appelle ma banque/)).toBeTruthy();
    });

    it('should display third option text', () => {
      render(<QuizModule />);

      expect(screen.getByText('Je partage le message')).toBeTruthy();
    });

    it('should have options unchecked initially', () => {
      const { container } = render(<QuizModule />);

      const radios = container.querySelectorAll('input[type="radio"]');
      radios.forEach(radio => {
        expect(radio.checked).toBe(false);
      });
    });
  });

  describe('Answer Selection', () => {
    it('should select option when clicked', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);

      expect(firstOption.checked).toBe(true);
    });

    it('should deselect previous option when new one selected', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      const secondOption = container.querySelector('input[value="1"]');

      fireEvent.click(firstOption);
      expect(firstOption.checked).toBe(true);

      fireEvent.click(secondOption);
      expect(firstOption.checked).toBe(false);
      expect(secondOption.checked).toBe(true);
    });

    it('should show feedback when answer selected', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);

      expect(screen.getByText(/Mauvais! Les vrais banques/)).toBeTruthy();
    });

    it('should show correct feedback for correct answer', () => {
      const { container } = render(<QuizModule />);

      const correctOption = container.querySelector('input[value="1"]');
      fireEvent.click(correctOption);

      expect(screen.getByText(/Correct! Vérifiez/)).toBeTruthy();
    });

    it('should display feedback with alert role', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);

      const feedback = container.querySelector('.feedback-box');
      expect(feedback.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live polite on feedback', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);

      const feedback = container.querySelector('.feedback-box');
      expect(feedback.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Navigation - Next Button', () => {
    it('should display next button', () => {
      render(<QuizModule />);

      expect(screen.getByText(/Suivant/)).toBeTruthy();
    });

    it('should disable next button when no answer selected', () => {
      const { container } = render(<QuizModule />);

      const nextButton = container.querySelector('.btn-next');
      expect(nextButton.disabled).toBe(true);
    });

    it('should enable next button when answer selected', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);

      const nextButton = container.querySelector('.btn-next');
      expect(nextButton.disabled).toBe(false);
    });

    it('should advance to next question on click', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);

      const nextButton = container.querySelector('.btn-next');
      fireEvent.click(nextButton);

      expect(screen.getByText(/Question 2\/5/)).toBeTruthy();
    });

    it('should clear selected answer for next question', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);

      const nextButton = container.querySelector('.btn-next');
      fireEvent.click(nextButton);

      const radios = container.querySelectorAll('input[type="radio"]');
      radios.forEach(radio => {
        expect(radio.checked).toBe(false);
      });
    });

    it('should hide feedback when moving to next question', () => {
      const { container } = render(<QuizModule />);

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);
      expect(screen.getByText(/Mauvais/)).toBeTruthy();

      const nextButton = container.querySelector('.btn-next');
      fireEvent.click(nextButton);

      const feedback = container.querySelector('.feedback-box');
      expect(feedback).toBeFalsy();
    });

    it('should update progress bar on next', () => {
      const { container } = render(<QuizModule />);

      let progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar.getAttribute('aria-valuenow')).toBe('20');

      const firstOption = container.querySelector('input[value="0"]');
      fireEvent.click(firstOption);

      const nextButton = container.querySelector('.btn-next');
      fireEvent.click(nextButton);

      progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar.getAttribute('aria-valuenow')).toBe('40');
    });

    it('should change button text on last question', () => {
      const { container } = render(<QuizModule />);

      // Navigate to last question
      for (let i = 0; i < 4; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/Terminer/)).toBeTruthy();
    });
  });

  describe('Quiz Completion', () => {
    it('should show results screen after last question', () => {
      const { container } = render(<QuizModule onComplete={mockOnComplete} />);

      // Answer all 5 questions (any answers, just to complete)
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/Quiz Terminé/)).toBeTruthy();
    });

    it('should call onComplete callback on finish', () => {
      const { container } = render(<QuizModule onComplete={mockOnComplete} />);

      // Answer all 5 questions with correct answers: [1, 0, 1, 0, 0]
      const correctAnswers = [1, 0, 1, 0, 0];
      for (let i = 0; i < 5; i++) {
        const option = container.querySelector(`input[value="${correctAnswers[i]}"]`);
        fireEvent.click(option);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('should pass score to onComplete callback', () => {
      const { container } = render(<QuizModule onComplete={mockOnComplete} />);

      // Answer all questions correctly: [1, 0, 1, 0, 0] = 100%
      const correctAnswers = [1, 0, 1, 0, 0];
      for (let i = 0; i < 5; i++) {
        const option = container.querySelector(`input[value="${correctAnswers[i]}"]`);
        fireEvent.click(option);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(mockOnComplete).toHaveBeenCalledWith(100, true);
    });

    it('should pass passed status to onComplete callback', () => {
      const { container } = render(<QuizModule onComplete={mockOnComplete} />);

      // Answer correctly (score >= 70): [1, 0, 1, 0, 0] = 100%
      const correctAnswers = [1, 0, 1, 0, 0];
      for (let i = 0; i < 5; i++) {
        const option = container.querySelector(`input[value="${correctAnswers[i]}"]`);
        fireEvent.click(option);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(mockOnComplete).toHaveBeenCalledWith(100, true);
    });
  });

  describe('Results Screen', () => {
    it('should display results title', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/Quiz Terminé/)).toBeTruthy();
    });

    it('should display score circle', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz with 0% (all wrong answers)
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const scoreCircle = container.querySelector('.score-circle');
      expect(scoreCircle).toBeTruthy();
    });

    it('should display score percentage', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz with 100% (all correct): [1, 0, 1, 0, 0]
      const correctAnswers = [1, 0, 1, 0, 0];
      for (let i = 0; i < 5; i++) {
        const option = container.querySelector(`input[value="${correctAnswers[i]}"]`);
        fireEvent.click(option);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const scoreCircle = container.querySelector('.score-circle');
      expect(scoreCircle.textContent).toContain('100');
    });

    it('should show success message when passed', () => {
      const { container } = render(<QuizModule />);

      // Answer enough correctly to pass (70%+)
      // Correct: [1, 0, 1, 0, 0], Answer: [1, 0, 1, 0, 1] = 4/5 = 80%
      const answers = [1, 0, 1, 0, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/Excellent/)).toBeTruthy();
    });

    it('should show improvement message when failed', () => {
      const { container } = render(<QuizModule />);

      // Answer all questions incorrectly (0%)
      // Correct: [1, 0, 1, 0, 0], Answer: [0, 1, 0, 1, 1] = 0/5 = 0%
      const answers = [0, 1, 0, 1, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/Continuez votre apprentissage/)).toBeTruthy();
    });

    it('should display correct count', () => {
      const { container } = render(<QuizModule />);

      // Answer 4 out of 5 correctly
      // Correct: [1, 0, 1, 0, 0], Answer: [1, 0, 1, 0, 1] = 4/5
      const correctIndices = [1, 0, 1, 0, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${correctIndices[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const statsDiv = container.querySelector('.results-stats');
      expect(statsDiv.textContent).toContain('4');
      expect(statsDiv.textContent).toContain('5');
    });

    it('should display XP earned', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz with 40% score
      const answers = [1, 0, 0, 0, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const statsDiv = container.querySelector('.results-stats');
      expect(statsDiv.textContent).toContain('XP');
    });

    it('should display credits earned badge', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz with any score
      const answers = [1, 0, 0, 0, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const badge = container.querySelector('.quiz-credits-badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('crédits');
    });

    it('should award 20 credits when passed', () => {
      const { container } = render(<QuizModule />);

      // Answer 4/5 correctly to pass (80%)
      // Correct: [1, 0, 1, 0, 0], Answer: [1, 0, 1, 0, 1] = 4/5
      const answers = [1, 0, 1, 0, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const badge = container.querySelector('.quiz-credits-badge');
      expect(badge.textContent).toContain('+20');
    });

    it('should award 5 credits when failed', () => {
      const { container } = render(<QuizModule />);

      // Answer incorrectly to score below 70%
      // Correct: [1, 0, 1, 0, 0], Answer: [0, 1, 0, 1, 1] = 0/5 = 0%
      const answers = [0, 1, 0, 1, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const badge = container.querySelector('.quiz-credits-badge');
      expect(badge.textContent).toContain('+5');
    });

    it('should have role="alert" on results screen', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const results = container.querySelector('[role="alert"]');
      expect(results).toBeTruthy();
    });

    it('should have aria-live assertive on results', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const results = container.querySelector('[aria-live="assertive"]');
      expect(results).toBeTruthy();
    });
  });

  describe('Restart Functionality', () => {
    it('should display restart button on results', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(screen.getByText(/Recommencer/)).toBeTruthy();
    });

    it('should reset to first question on restart', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const restartButton = screen.getByText(/Recommencer/);
      fireEvent.click(restartButton);

      expect(screen.getByText(/Question 1\/5/)).toBeTruthy();
    });

    it('should return to quiz screen after restart', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const restartButton = screen.getByText(/Recommencer/);
      fireEvent.click(restartButton);

      expect(screen.getByText(/Quiz Interactif/)).toBeTruthy();
      expect(container.querySelector('.quiz-module')).toBeTruthy();
    });

    it('should clear answers on restart', () => {
      const { container } = render(<QuizModule />);

      // Complete quiz
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const restartButton = screen.getByText(/Recommencer/);
      fireEvent.click(restartButton);

      // Check that submit button is disabled (no answer selected)
      const nextButton = container.querySelector('.btn-next');
      expect(nextButton.disabled).toBe(true);
    });

    it('should allow retaking quiz after restart', () => {
      const { container } = render(<QuizModule />);

      // Complete first quiz with wrong answers
      for (let i = 0; i < 5; i++) {
        const firstOption = container.querySelector('input[value="0"]');
        fireEvent.click(firstOption);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const restartButton = screen.getByText(/Recommencer/);
      fireEvent.click(restartButton);

      // Take quiz again with correct answers: [1, 0, 1, 0, 0]
      const correctAnswers = [1, 0, 1, 0, 0];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${correctAnswers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const scoreCircle = container.querySelector('.score-circle');
      expect(scoreCircle.textContent).toContain('100');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<QuizModule />);

      const h2 = container.querySelector('h2');
      const h3 = container.querySelector('h3');
      expect(h2).toBeTruthy();
      expect(h3).toBeTruthy();
    });

    it('should have aria-label on progress bar', () => {
      const { container } = render(<QuizModule />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-valuenow on progress bar', () => {
      const { container } = render(<QuizModule />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar.getAttribute('aria-valuenow')).toBeTruthy();
    });

    it('should have aria-valuemin on progress bar', () => {
      const { container } = render(<QuizModule />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
    });

    it('should have aria-valuemax on progress bar', () => {
      const { container } = render(<QuizModule />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('should have proper label associations for radio buttons', () => {
      const { container } = render(<QuizModule />);

      const labels = container.querySelectorAll('label');
      expect(labels.length).toBe(3);

      labels.forEach(label => {
        expect(label.querySelector('input[type="radio"]')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should render without onComplete prop', () => {
      const { container } = render(<QuizModule />);

      expect(container.querySelector('.quiz-module')).toBeTruthy();
    });

    it('should calculate 0% score correctly', () => {
      const { container } = render(<QuizModule />);

      // Answer all incorrectly: correct [1, 0, 1, 0, 0], answer [0, 1, 0, 1, 1]
      const answers = [0, 1, 0, 1, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const scoreCircle = container.querySelector('.score-circle');
      expect(scoreCircle.textContent).toContain('0');
    });

    it('should calculate 100% score correctly', () => {
      const { container } = render(<QuizModule />);

      // Answer all correctly: [1, 0, 1, 0, 0]
      const correctAnswers = [1, 0, 1, 0, 0];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${correctAnswers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const scoreCircle = container.querySelector('.score-circle');
      expect(scoreCircle.textContent).toContain('100');
    });

    it('should calculate partial score correctly', () => {
      const { container } = render(<QuizModule />);

      // Correct answers are at indices: [1, 0, 1, 0, 0]
      // Answer: [1, 0, 0, 0, 1] = Q1✓ Q2✓ Q3✗ Q4✓ Q5✗ = 3/5 = 60%
      const answers = [1, 0, 0, 0, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      const scoreCircle = container.querySelector('.score-circle');
      expect(scoreCircle.textContent).toContain('60');
    });

    it('should show passed status with 4/5 correct (80%)', () => {
      const mockOnComplete = vi.fn();
      const { container } = render(<QuizModule onComplete={mockOnComplete} />);

      // Correct answers: [1, 0, 1, 0, 0]
      // Answer: [1, 0, 1, 0, 1] = 4 correct out of 5 = 80% (passes)
      const answers = [1, 0, 1, 0, 1];
      for (let i = 0; i < 5; i++) {
        const selected = container.querySelector(`input[value="${answers[i]}"]`);
        fireEvent.click(selected);
        const nextButton = container.querySelector('.btn-next');
        fireEvent.click(nextButton);
      }

      expect(mockOnComplete).toHaveBeenCalledWith(80, true);
    });
  });
});
