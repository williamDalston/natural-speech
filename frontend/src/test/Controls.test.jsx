import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Controls from '../components/Controls';

describe('Controls', () => {
  const defaultProps = {
    voices: ['af_bella', 'af_sarah', 'am_michael'],
    selectedVoice: 'af_bella',
    setSelectedVoice: vi.fn(),
    speed: 1.0,
    setSpeed: vi.fn(),
    onGenerate: vi.fn(),
    isLoading: false,
  };

  it('renders voice selector', () => {
    render(<Controls {...defaultProps} />);
    
    const voiceSelect = screen.getByLabelText(/voice selection/i);
    expect(voiceSelect).toBeInTheDocument();
  });

  it('renders speed slider', () => {
    render(<Controls {...defaultProps} />);
    
    const speedSlider = screen.getByLabelText(/speech speed/i);
    expect(speedSlider).toBeInTheDocument();
    expect(speedSlider).toHaveValue('1');
  });

  it('calls setSelectedVoice when voice changes', async () => {
    const user = userEvent.setup();
    const setSelectedVoice = vi.fn();
    
    render(<Controls {...defaultProps} setSelectedVoice={setSelectedVoice} />);
    
    const voiceSelect = screen.getByLabelText(/voice selection/i);
    await user.selectOptions(voiceSelect, 'af_sarah');
    
    expect(setSelectedVoice).toHaveBeenCalled();
  });

  it('calls setSpeed when speed slider changes', async () => {
    const user = userEvent.setup();
    const setSpeed = vi.fn();
    
    render(<Controls {...defaultProps} setSpeed={setSpeed} />);
    
    const speedSlider = screen.getByLabelText(/speech speed/i);
    await user.clear(speedSlider);
    await user.type(speedSlider, '1.5');
    
    expect(setSpeed).toHaveBeenCalled();
  });

  it('calls onGenerate when generate button is clicked', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    
    render(<Controls {...defaultProps} onGenerate={onGenerate} />);
    
    const generateButton = screen.getByLabelText(/generate content/i);
    await user.click(generateButton);
    
    expect(onGenerate).toHaveBeenCalled();
  });

  it('disables generate button when loading', () => {
    render(<Controls {...defaultProps} isLoading={true} />);
    
    const generateButton = screen.getByLabelText(/generate content/i);
    expect(generateButton).toBeDisabled();
  });

  it('shows loading state when isLoading is true', () => {
    render(<Controls {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });
});

