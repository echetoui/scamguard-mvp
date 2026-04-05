import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert Component', () => {
  it('should render error alert', () => {
    render(<Alert variant="error" title="Error" message="Something went wrong" />);
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('should render warning alert', () => {
    render(<Alert variant="warning" title="Warning" message="Be careful" />);
    expect(screen.getByText('Warning')).toBeTruthy();
    expect(screen.getByText('Be careful')).toBeTruthy();
  });

  it('should render success alert', () => {
    render(<Alert variant="success" title="Success" message="All done" />);
    expect(screen.getByText('Success')).toBeTruthy();
    expect(screen.getByText('All done')).toBeTruthy();
  });

  it('should render info alert', () => {
    render(<Alert variant="info" title="Info" message="Take note" />);
    expect(screen.getByText('Info')).toBeTruthy();
    expect(screen.getByText('Take note')).toBeTruthy();
  });

  it('should show dismiss button when dismissable is true', () => {
    render(
      <Alert
        variant="error"
        title="Error"
        message="test"
        dismissable={true}
      />
    );
    const dismissBtn = screen.getByRole('button', { name: /dismiss alert/i });
    expect(dismissBtn).toBeTruthy();
  });

  it('should call onDismiss when dismiss button clicked', () => {
    const handleDismiss = vi.fn();
    render(
      <Alert
        variant="error"
        title="Error"
        message="test"
        dismissable={true}
        onDismiss={handleDismiss}
      />
    );
    const dismissBtn = screen.getByRole('button', { name: /dismiss alert/i });
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not show dismiss button when dismissable is false', () => {
    render(
      <Alert
        variant="error"
        title="Error"
        message="test"
        dismissable={false}
      />
    );
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('should have proper border-left stripe', () => {
    const { container } = render(
      <Alert variant="error" title="Error" message="test" />
    );
    const alert = container.firstChild;
    const styles = window.getComputedStyle(alert);
    expect(alert.style.borderLeft).toContain('4px solid');
  });

  it('should display full width with padding', () => {
    const { container } = render(
      <Alert variant="info" title="Info" message="test" />
    );
    const alert = container.firstChild;
    expect(alert.style.width).toBe('100%');
    expect(alert.style.padding).toBe('16px');
  });

  it('should apply correct icon for each variant', () => {
    const { rerender, container } = render(
      <Alert variant="error" title="Error" message="test" />
    );
    let iconDiv = container.querySelector('[style*="fontSize: 32px"]');
    expect(iconDiv.textContent).toContain('⚠️');

    rerender(<Alert variant="success" title="Success" message="test" />);
    iconDiv = container.querySelector('[style*="fontSize: 32px"]');
    expect(iconDiv.textContent).toContain('✓');

    rerender(<Alert variant="info" title="Info" message="test" />);
    iconDiv = container.querySelector('[style*="fontSize: 32px"]');
    expect(iconDiv.textContent).toContain('ℹ️');

    rerender(<Alert variant="warning" title="Warning" message="test" />);
    iconDiv = container.querySelector('[style*="fontSize: 32px"]');
    expect(iconDiv.textContent).toContain('⚠️');
  });

  it('should render without title if not provided', () => {
    render(<Alert variant="info" message="Just a message" />);
    expect(screen.getByText('Just a message')).toBeTruthy();
  });

  it('should render without message if not provided', () => {
    render(<Alert variant="info" title="Just a title" />);
    expect(screen.getByText('Just a title')).toBeTruthy();
  });
});
