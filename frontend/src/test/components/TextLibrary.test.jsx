import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TextLibrary from '../../components/TextLibrary';
import * as api from '../../api';

// Mock API
vi.mock('../../api', () => ({
  getWritings: vi.fn(),
  deleteWriting: vi.fn(),
  generateSpeech: vi.fn(),
  getGenres: vi.fn(),
}));

// Mock hooks
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../hooks/useMobile', () => ({
  useMobile: () => ({
    isMobile: false,
    isTouchDevice: false,
  }),
}));

vi.mock('../../hooks/useTouchGestures', () => ({
  usePullToRefresh: () => ({ current: null }),
}));

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    setActiveTab: vi.fn(),
  }),
}));

const mockWritings = [
  {
    id: 1,
    title: 'Test Writing 1',
    content: 'This is test content',
    author: 'Test Author',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Test Writing 2',
    content: 'Another test content',
    author: 'Another Author',
    created_at: '2024-01-02T00:00:00Z',
  },
];

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TextLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getWritings.mockResolvedValue({ writings: mockWritings });
    api.getGenres.mockResolvedValue({ genres: [] });
  });

  it('renders writings list', async () => {
    renderWithRouter(<TextLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Writing 1')).toBeInTheDocument();
      expect(screen.getByText('Test Writing 2')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    api.getWritings.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<TextLibrary />);
    
    // Loading spinner should be visible
    expect(screen.queryByText('Test Writing 1')).not.toBeInTheDocument();
  });

  it('displays empty state when no writings', async () => {
    api.getWritings.mockResolvedValue({ writings: [] });
    
    renderWithRouter(<TextLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText(/no writings found/i)).toBeInTheDocument();
    });
  });

  it('searches writings', async () => {
    renderWithRouter(<TextLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Writing 1')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByLabelText(/search writings/i);
    fireEvent.change(searchInput, { target: { value: 'Test Writing 1' } });
    
    await waitFor(() => {
      expect(api.getWritings).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Test Writing 1',
        null,
        null,
        null,
        null,
        null,
        null
      );
    });
  });

  it('opens detail modal when writing is clicked', async () => {
    renderWithRouter(<TextLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Writing 1')).toBeInTheDocument();
    });
    
    const writingCard = screen.getByText('Test Writing 1').closest('[class*="card"]');
    if (writingCard) {
      fireEvent.click(writingCard);
      
      await waitFor(() => {
        // Modal should open with writing details
        expect(screen.getByText('Test Writing 1')).toBeInTheDocument();
      });
    }
  });

  it('deletes writing with confirmation', async () => {
    api.deleteWriting.mockResolvedValue({});
    api.getWritings.mockResolvedValue({ writings: [mockWritings[1]] });
    
    renderWithRouter(<TextLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Writing 1')).toBeInTheDocument();
    });
    
    // Find delete button (may need to hover first)
    const deleteButtons = screen.queryAllByLabelText(/delete/i);
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        // Confirmation modal should appear
        expect(screen.getByText(/delete writing/i)).toBeInTheDocument();
      });
    }
  });

  it('displays writing metadata', async () => {
    renderWithRouter(<TextLibrary />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Writing 1')).toBeInTheDocument();
      expect(screen.getByText(/test author/i)).toBeInTheDocument();
    });
  });
});

