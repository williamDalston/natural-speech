import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AudioPlayer from '../../components/AudioPlayer';
import { createMockAudio, mockObjectURL } from '../test-utils';

describe('AudioPlayer', () => {
  let mockAudio;
  let mockUrl;

  beforeEach(() => {
    mockAudio = createMockAudio();
    mockUrl = mockObjectURL();
    
    // Mock audio element
    global.Audio = vi.fn().mockImplementation(() => mockAudio);
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test-audio-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders audio player when audioUrl is provided', () => {
    const { container } = render(<AudioPlayer audioUrl="blob:test-url" />);
    const audio = container.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('src', 'blob:test-url');
  });

  it('does not render when audioUrl is null', () => {
    const { container } = render(<AudioPlayer audioUrl={null} />);
    const audio = container.querySelector('audio');
    expect(audio).not.toBeInTheDocument();
  });

  it('has play button', () => {
    render(<AudioPlayer audioUrl="blob:test-url" />);
    const playButton = screen.getByLabelText(/play/i);
    expect(playButton).toBeInTheDocument();
  });

  it('toggles play/pause when play button is clicked', async () => {
    const user = userEvent.setup();
    render(<AudioPlayer audioUrl="blob:test-url" />);
    
    const playButton = screen.getByLabelText(/play/i);
    await user.click(playButton);
    
    // After clicking, should show pause button
    await waitFor(() => {
      expect(screen.getByLabelText(/pause/i)).toBeInTheDocument();
    });
  });

  it('has download button', () => {
    render(<AudioPlayer audioUrl="blob:test-url" />);
    const downloadButton = screen.getByLabelText(/download/i);
    expect(downloadButton).toBeInTheDocument();
  });

  it('has share button', () => {
    render(<AudioPlayer audioUrl="blob:test-url" />);
    const shareButton = screen.getByLabelText(/share/i);
    expect(shareButton).toBeInTheDocument();
  });

  it('has volume control', () => {
    render(<AudioPlayer audioUrl="blob:test-url" />);
    const volumeControl = screen.getByLabelText(/volume/i);
    expect(volumeControl).toBeInTheDocument();
  });

  it('has proper ARIA labels', () => {
    render(<AudioPlayer audioUrl="blob:test-url" />);
    
    expect(screen.getByLabelText(/play|pause/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/download/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/share/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/volume/i)).toBeInTheDocument();
  });

  it('displays time information', () => {
    render(<AudioPlayer audioUrl="blob:test-url" />);
    
    // Should display time (format may vary)
    const timeDisplay = screen.getByText(/\d+:\d+/);
    expect(timeDisplay).toBeInTheDocument();
  });
});

