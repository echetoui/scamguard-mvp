/**
 * QuizCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizCard from './QuizCard';

describe('QuizCard Component', () => {
  const mockOptions = [
    { id: 'a', text: 'This is a scam', correct: true },
    { id: 'b', text: 'This is legitimate', correct: false },
    { id: 'c', text: 'Unclear', correct: false }
  ];

  it('renders quiz question and all options', () => {
    render(
      <QuizCard
        question="Is this a phishing email?"
        options={mockOptions}
        onAnswer={() => {}}
      />
    );
    expect(screen.getByText('Is this a phishing email?')).toBeInTheDocument();
    expect(screen.getByText('This is a scam')).toBeInTheDocument();
    expect(screen.getByText('This is legitimate')).toBeInTheDocument();
  });

  it('calls onAnswer when option selected', () => {
    const mockOnAnswer = vi.fn();
    render(
      <QuizCard
        question="Test question"
        options={mockOptions}
        onAnswer={mockOnAnswer}
      />
    );
    fireEvent.click(screen.getByText('This is a scam'));
    expect(mockOnAnswer).toHaveBeenCalledWith('a', true);
  });

  it('passes correct flag to onAnswer callback', () => {
    const mockOnAnswer = vi.fn();
    render(
      <QuizCard
        question="Test question"
        options={mockOptions}
        onAnswer={mockOnAnswer}
      />
    );
    fireEvent.click(screen.getByText('This is legitimate'));
    expect(mockOnAnswer).toHaveBeenCalledWith('b', false);
  });

  it('disables options after answering', () => {
    render(
      <QuizCard
        question="Test question"
        options={mockOptions}
        onAnswer={() => {}}
      />
    );
    fireEvent.click(screen.getByText('This is a scam'));
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('shows correct/incorrect indicator after answer', () => {
    render(
      <QuizCard
        question="Test question"
        options={mockOptions}
        onAnswer={() => {}}
      />
    );
    fireEvent.click(screen.getByText('This is a scam'));
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders category and question number when provided', () => {
    render(
      <QuizCard
        question="Test question"
        options={mockOptions}
        onAnswer={() => {}}
        category="Email Security"
        number={3}
      />
    );
    expect(screen.getByText('Email Security')).toBeInTheDocument();
    expect(screen.getByText('Question 3')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <QuizCard
        question="Test question"
        options={mockOptions}
        onAnswer={() => {}}
      />
    );
    expect(screen.getByRole('article')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('prevents multiple answers', () => {
    const mockOnAnswer = vi.fn();
    render(
      <QuizCard
        question="Test question"
        options={mockOptions}
        onAnswer={mockOnAnswer}
      />
    );
    fireEvent.click(screen.getByText('This is a scam'));
    expect(mockOnAnswer).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByText('This is legitimate'));
    expect(mockOnAnswer).toHaveBeenCalledTimes(1);
  });
});
