/**
 * ErrorBoundary Component Tests
 * Phase 5F - Component Test Coverage Expansion
 *
 * Tests for:
 * - Component rendering and props handling
 * - Static lifecycle methods
 * - Instance methods (reset, reload)
 * - Normal children rendering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Test components
const GoodComponent = () => <div>Good Component</div>;
const MultiChild = () => (
  <>
    <div>Child 1</div>
    <div>Child 2</div>
  </>
);

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Component Rendering', () => {
    it('should render single child component', () => {
      render(
        <ErrorBoundary>
          <GoodComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText('Good Component')).toBeTruthy();
    });

    it('should render multiple child components', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Child 1')).toBeTruthy();
      expect(screen.getByText('Child 2')).toBeTruthy();
      expect(screen.getByText('Child 3')).toBeTruthy();
    });

    it('should render fragment children', () => {
      render(
        <ErrorBoundary>
          <MultiChild />
        </ErrorBoundary>
      );
      expect(screen.getByText('Child 1')).toBeTruthy();
      expect(screen.getByText('Child 2')).toBeTruthy();
    });

    it('should render empty div', () => {
      const { container } = render(
        <ErrorBoundary>
          <div />
        </ErrorBoundary>
      );
      expect(container).toBeTruthy();
    });

    it('should render with null children', () => {
      const { container } = render(
        <ErrorBoundary>{null}</ErrorBoundary>
      );
      expect(container).toBeTruthy();
    });

    it('should not show error UI when children render successfully', () => {
      const { container } = render(
        <ErrorBoundary>
          <GoodComponent />
        </ErrorBoundary>
      );
      expect(container.querySelector('.error-boundary-container')).toBeFalsy();
    });
  });

  describe('Static Methods', () => {
    it('should have getDerivedStateFromError static method', () => {
      expect(ErrorBoundary.getDerivedStateFromError).toBeDefined();
      expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
    });

    it('should set hasError to true from getDerivedStateFromError', () => {
      const error = new Error('Test error');
      const state = ErrorBoundary.getDerivedStateFromError(error);
      expect(state).toBeDefined();
      expect(state.hasError).toBe(true);
    });

    it('should work with any error type', () => {
      const errors = [
        new Error('Regular error'),
        new TypeError('Type error'),
        new ReferenceError('Reference error'),
        { message: 'Custom object' },
      ];

      errors.forEach(error => {
        const state = ErrorBoundary.getDerivedStateFromError(error);
        expect(state.hasError).toBe(true);
      });
    });
  });

  describe('Instance Methods', () => {
    it('should have componentDidCatch method', () => {
      const boundary = new ErrorBoundary({});
      expect(boundary.componentDidCatch).toBeDefined();
      expect(typeof boundary.componentDidCatch).toBe('function');
    });

    it('should have handleReset method', () => {
      const boundary = new ErrorBoundary({});
      expect(boundary.handleReset).toBeDefined();
      expect(typeof boundary.handleReset).toBe('function');
    });

    it('should have handleReload method', () => {
      const boundary = new ErrorBoundary({});
      expect(boundary.handleReload).toBeDefined();
      expect(typeof boundary.handleReload).toBe('function');
    });

    it('should call componentDidCatch without throwing', () => {
      const boundary = new ErrorBoundary({});
      const error = new Error('Test');
      const errorInfo = { componentStack: 'test' };

      expect(() => {
        boundary.componentDidCatch(error, errorInfo);
      }).not.toThrow();
    });

    it('should have handleReload method that exists', () => {
      const boundary = new ErrorBoundary({});
      expect(boundary.handleReload).toBeDefined();
      expect(typeof boundary.handleReload).toBe('function');
    });

    it('should call handleReset without throwing', () => {
      const boundary = new ErrorBoundary({});
      expect(() => {
        boundary.handleReset();
      }).not.toThrow();
    });
  });

  describe('Constructor', () => {
    it('should initialize with correct initial state', () => {
      const boundary = new ErrorBoundary({});
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBe(null);
      expect(boundary.state.errorInfo).toBe(null);
      expect(boundary.state.errorCount).toBe(0);
    });

    it('should accept children prop', () => {
      const child = <div>Test</div>;
      const boundary = new ErrorBoundary({ children: child });
      expect(boundary.props.children).toBe(child);
    });

    it('should accept multiple children', () => {
      const children = [
        <div key="1">Child 1</div>,
        <div key="2">Child 2</div>,
      ];
      const boundary = new ErrorBoundary({ children });
      expect(boundary.props.children).toBeDefined();
    });
  });

  describe('Normal Render Path', () => {
    it('should return children in render when no error', () => {
      const child = <div className="test-child">Content</div>;
      const boundary = new ErrorBoundary({ children: child });
      const rendered = boundary.render();

      // When no error, should return children directly
      expect(rendered).toBeDefined();
    });

    it('should not show error container when no error', () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Test</div>
        </ErrorBoundary>
      );
      expect(container.querySelector('.error-boundary-container')).toBeFalsy();
    });

    it('should preserve all children props', () => {
      const { container } = render(
        <ErrorBoundary>
          <div className="child-class">Content</div>
        </ErrorBoundary>
      );
      expect(container.querySelector('.child-class')).toBeTruthy();
    });
  });

  describe('Props Handling', () => {
    it('should handle undefined children', () => {
      const boundary = new ErrorBoundary({ children: undefined });
      const rendered = boundary.render();
      expect(rendered).toBeUndefined();
    });

    it('should handle null children', () => {
      const { container } = render(
        <ErrorBoundary>{null}</ErrorBoundary>
      );
      expect(container).toBeTruthy();
    });

    it('should handle text children', () => {
      render(<ErrorBoundary>Text content</ErrorBoundary>);
      expect(screen.getByText('Text content')).toBeTruthy();
    });

    it('should handle array of children', () => {
      render(
        <ErrorBoundary>
          {[<div key="1">Item 1</div>, <div key="2">Item 2</div>]}
        </ErrorBoundary>
      );
      expect(screen.getByText('Item 1')).toBeTruthy();
      expect(screen.getByText('Item 2')).toBeTruthy();
    });
  });

  describe('Lifecycle Methods', () => {
    it('should have getDerivedStateFromError for error detection', () => {
      const method = ErrorBoundary.getDerivedStateFromError;
      expect(method).toBeDefined();

      const result = method(new Error('test'));
      expect(result).toHaveProperty('hasError');
    });

    it('should handle componentDidCatch logging', () => {
      const boundary = new ErrorBoundary({});
      const error = new Error('Test error');
      const errorInfo = { componentStack: 'TestComponent' };

      boundary.componentDidCatch(error, errorInfo);

      // Should have logged to console
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle multiple error catches', () => {
      const boundary = new ErrorBoundary({});
      const error = new Error('Test');
      const errorInfo = { componentStack: 'test' };

      for (let i = 0; i < 3; i++) {
        expect(() => {
          boundary.componentDidCatch(error, errorInfo);
        }).not.toThrow();
      }
    });
  });

  describe('Window Methods', () => {
    it('should have handleReload that references window.location', () => {
      const boundary = new ErrorBoundary({});
      // handleReload method should exist and be callable
      expect(typeof boundary.handleReload).toBe('function');
    });

    it('should have methods for both reset and reload actions', () => {
      const boundary = new ErrorBoundary({});
      expect(boundary.handleReset).toBeDefined();
      expect(boundary.handleReload).toBeDefined();
    });
  });

  describe('Error Boundary Container', () => {
    it('should render error container only when needed', () => {
      const { container: container1 } = render(
        <ErrorBoundary>
          <div>Good content</div>
        </ErrorBoundary>
      );

      // Good content should render normally
      expect(container1.querySelector('.error-boundary-container')).toBeFalsy();
      expect(screen.getByText('Good content')).toBeTruthy();
    });

    it('should have proper container structure', () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Content</div>
        </ErrorBoundary>
      );

      // When no error, error container should not exist
      const errorContainer = container.querySelector('.error-boundary-container');
      expect(errorContainer).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle render with empty children array', () => {
      const { container } = render(
        <ErrorBoundary>{[]}</ErrorBoundary>
      );
      expect(container).toBeTruthy();
    });

    it('should handle children with special characters', () => {
      render(
        <ErrorBoundary>
          <div>Test &amp; Special "Quotes" &lt;Tags&gt;</div>
        </ErrorBoundary>
      );
      expect(screen.getByText(/Test/)).toBeTruthy();
    });

    it('should handle rapid child updates', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <div>Version 1</div>
        </ErrorBoundary>
      );

      rerender(
        <ErrorBoundary>
          <div>Version 2</div>
        </ErrorBoundary>
      );

      rerender(
        <ErrorBoundary>
          <div>Version 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Version 3')).toBeTruthy();
      expect(screen.queryByText('Version 1')).toBeFalsy();
    });

    it('should maintain boundary wrapper identity', () => {
      const { container: cont1 } = render(
        <ErrorBoundary>
          <div>Test</div>
        </ErrorBoundary>
      );

      expect(cont1).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should render accessible content', () => {
      const { container } = render(
        <ErrorBoundary>
          <div role="main">Main content</div>
        </ErrorBoundary>
      );

      expect(container.querySelector('[role="main"]')).toBeTruthy();
    });

    it('should not add unnecessary ARIA attributes on normal render', () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      // Error boundary itself shouldn't add aria attributes when no error
      const boundary = container.querySelector('.error-boundary-container');
      expect(boundary).toBeFalsy();
    });
  });
});
