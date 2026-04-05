// frontend/src/design-system/__tests__/Alert.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../Alert';

describe('Alert Component', () => {
  it('renders error alert', () => {
    render(<Alert variant="error" title="Error" message="Something went wrong" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders warning alert', () => {
    render(<Alert variant="warning" title="Warning" message="Be careful" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('renders success alert', () => {
    render(<Alert variant="success" title="Success" message="All done" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders info alert', () => {
    render(<Alert variant="info" title="Info" message="Take note" />);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('shows dismiss button when dismissable is true', () => {
    render(
      <Alert
        variant="error"
        title="Error"
        message="test"
        dismissable={true}
      />
    );
    const dismissBtn = screen.getByRole('button');
    expect(dismissBtn).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button clicked', async () => {
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
    const dismissBtn = screen.getByRole('button');
    await userEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalled();
  });

  it('does not show dismiss button when dismissable is false', () => {
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

  it('has proper border-left stripe', () => {
    const { container } = render(
      <Alert variant="error" title="Error" message="test" />
    );
    const alert = container.firstChild;
    const borderLeft = alert.style.borderLeft;
    expect(borderLeft).toMatch(/4px\s+solid/);
  });

  it('displays full width with padding', () => {
    const { container } = render(
      <Alert variant="info" title="Info" message="test" />
    );
    const alert = container.firstChild;
    expect(alert).toHaveStyle({ width: '100%' });
  });

  it('renders without title', () => {
    render(<Alert variant="info" message="Message only" />);
    expect(screen.getByText('Message only')).toBeInTheDocument();
  });

  it('renders without message', () => {
    render(<Alert variant="success" title="Success" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
