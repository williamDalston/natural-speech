import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastContainer from '../../components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockToast = {
    id: '1',
    type: 'success',
    message: 'Test message',
    title: 'Test Title',
    duration: 3000,
  };

  const mockRemoveToast = vi.fn();

  it('renders toast with message', () => {
    render(
      <ToastContainer 
        toasts={[mockToast]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders success toast with correct styling', () => {
    render(
      <ToastContainer 
        toasts={[{ ...mockToast, type: 'success' }]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-green-500/10');
  });

  it('renders error toast with correct styling', () => {
    render(
      <ToastContainer 
        toasts={[{ ...mockToast, type: 'error' }]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-red-500/10');
  });

  it('renders info toast with correct styling', () => {
    render(
      <ToastContainer 
        toasts={[{ ...mockToast, type: 'info' }]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-blue-500/10');
  });

  it('renders warning toast with correct styling', () => {
    render(
      <ToastContainer 
        toasts={[{ ...mockToast, type: 'warning' }]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-yellow-500/10');
  });

  it('closes toast when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastContainer 
        toasts={[mockToast]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    const closeButton = screen.getByLabelText(/close/i);
    await user.click(closeButton);
    
    expect(mockRemoveToast).toHaveBeenCalledWith('1');
  });

  it('auto-closes toast after duration', async () => {
    render(
      <ToastContainer 
        toasts={[{ ...mockToast, duration: 3000 }]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(mockRemoveToast).toHaveBeenCalledWith('1');
    });
  });

  it('does not auto-close if duration is 0', async () => {
    render(
      <ToastContainer 
        toasts={[{ ...mockToast, duration: 0 }]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    vi.advanceTimersByTime(5000);
    
    // Should not have been called
    expect(mockRemoveToast).not.toHaveBeenCalled();
  });

  it('has proper ARIA live region', () => {
    render(
      <ToastContainer 
        toasts={[mockToast]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('has assertive ARIA live for error toasts', () => {
    render(
      <ToastContainer 
        toasts={[{ ...mockToast, type: 'error' }]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders multiple toasts', () => {
    const toasts = [
      { ...mockToast, id: '1', message: 'First message' },
      { ...mockToast, id: '2', message: 'Second message' },
    ];
    
    render(
      <ToastContainer 
        toasts={toasts} 
        removeToast={mockRemoveToast} 
      />
    );
    
    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
  });

  it('renders toast without title', () => {
    render(
      <ToastContainer 
        toasts={[{ ...mockToast, title: undefined }]} 
        removeToast={mockRemoveToast} 
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });
});

