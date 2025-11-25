import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TextEditor from '../../components/TextEditor';
import * as api from '../../api';

// Mock API
vi.mock('../../api', () => ({
  getVoices: vi.fn(),
  createWriting: vi.fn(),
  updateWriting: vi.fn(),
  generateSpeech: vi.fn(),
}));

// Mock hooks
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    clearDraft: vi.fn(),
    recoverDraft: vi.fn(),
  }),
}));

vi.mock('../../hooks/useMobile', () => ({
  useMobile: () => ({
    isMobile: false,
    isTouchDevice: false,
  }),
  useReducedMotion: () => false,
}));

vi.mock('../../hooks/useTouchGestures', () => ({
  useTouchGestures: () => ({ current: null }),
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TextEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getVoices.mockResolvedValue({ voices: ['af_bella', 'af_sarah'] });
  });

  it('renders new writing form', async () => {
    renderWithRouter(<TextEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText(/new writing/i)).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText(/writing title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/writing content/i)).toBeInTheDocument();
  });

  it('renders edit form with existing writing', async () => {
    const writing = {
      id: 1,
      title: 'Test Title',
      content: 'Test content',
      author: 'Test Author',
    };

    renderWithRouter(
      <TextEditor writing={writing} onSave={vi.fn()} onCancel={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument();
    });
    
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Author')).toBeInTheDocument();
  });

  it('updates content when typing', async () => {
    renderWithRouter(<TextEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    
    const contentInput = screen.getByLabelText(/writing content/i);
    fireEvent.change(contentInput, { target: { value: 'New content' } });
    
    expect(contentInput).toHaveValue('New content');
  });

  it('shows word and character count', async () => {
    renderWithRouter(<TextEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    
    const contentInput = screen.getByLabelText(/writing content/i);
    fireEvent.change(contentInput, { target: { value: 'Hello world' } });
    
    await waitFor(() => {
      expect(screen.getByText(/2 words/i)).toBeInTheDocument();
      expect(screen.getByText(/11 chars/i)).toBeInTheDocument();
    });
  });

  it('calls onSave when save button is clicked', async () => {
    const onSave = vi.fn();
    api.createWriting.mockResolvedValue({ id: 1 });

    renderWithRouter(<TextEditor onSave={onSave} onCancel={vi.fn()} />);
    
    const contentInput = screen.getByLabelText(/writing content/i);
    fireEvent.change(contentInput, { target: { value: 'Test content' } });
    
    const saveButton = screen.getByLabelText(/save writing/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(api.createWriting).toHaveBeenCalledWith({
        title: '',
        content: 'Test content',
        author: '',
      });
    });
  });

  it('disables save button when content is empty', async () => {
    renderWithRouter(<TextEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    
    const saveButton = screen.getByLabelText(/save writing/i);
    expect(saveButton).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    renderWithRouter(<TextEditor onSave={vi.fn()} onCancel={onCancel} />);
    
    const cancelButton = screen.getByLabelText(/cancel editing/i);
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('loads voices on mount', async () => {
    renderWithRouter(<TextEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    
    await waitFor(() => {
      expect(api.getVoices).toHaveBeenCalled();
    });
  });

  it('generates audio when generate button is clicked', async () => {
    const mockBlob = new Blob(['audio'], { type: 'audio/wav' });
    api.generateSpeech.mockResolvedValue(mockBlob);

    renderWithRouter(<TextEditor onSave={vi.fn()} onCancel={vi.fn()} />);
    
    const contentInput = screen.getByLabelText(/writing content/i);
    fireEvent.change(contentInput, { target: { value: 'Test content' } });
    
    await waitFor(() => {
      const generateButton = screen.getByLabelText(/generate audio preview/i);
      fireEvent.click(generateButton);
    });
    
    await waitFor(() => {
      expect(api.generateSpeech).toHaveBeenCalled();
    });
  });
});

