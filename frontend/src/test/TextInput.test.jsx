import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from '../components/TextInput';

describe('TextInput', () => {
  it('renders textarea with placeholder', () => {
    const setText = vi.fn();
    render(<TextInput text="" setText={setText} />);
    
    const textarea = screen.getByPlaceholderText(/enter your script here/i);
    expect(textarea).toBeInTheDocument();
  });

  it('displays character count', () => {
    const setText = vi.fn();
    render(<TextInput text="Hello" setText={setText} />);
    
    expect(screen.getByText(/5 \/ 5000 characters/i)).toBeInTheDocument();
  });

  it('calls setText when text changes', async () => {
    const user = userEvent.setup();
    const setText = vi.fn();
    render(<TextInput text="" setText={setText} />);
    
    const textarea = screen.getByPlaceholderText(/enter your script here/i);
    await user.type(textarea, 'Test');
    
    expect(setText).toHaveBeenCalled();
  });

  it('respects max length limit', async () => {
    const user = userEvent.setup();
    const setText = vi.fn();
    const longText = 'a'.repeat(5001);
    
    render(<TextInput text={longText} setText={setText} />);
    
    const textarea = screen.getByPlaceholderText(/enter your script here/i);
    expect(textarea.value.length).toBeLessThanOrEqual(5000);
  });

  it('shows warning when near character limit', () => {
    const setText = vi.fn();
    const nearLimitText = 'a'.repeat(4501); // 90% of 5000
    
    render(<TextInput text={nearLimitText} setText={setText} />);
    
    const charCount = screen.getByText(/4501 \/ 5000 characters/i);
    expect(charCount).toHaveClass('text-yellow-400');
  });
});

