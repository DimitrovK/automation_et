import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/footballer-api', () => ({
  FootballerAPI: {
    getFootballerPictures: vi.fn(),
    uploadFootballerPicture: vi.fn(),
    patchFootballerPicture: vi.fn(),
    deleteFootballerPicture: vi.fn(),
  },
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { PicturesEditor } from '@/components/footballer-management/sub-editors/PicturesEditor';
import { FootballerAPI } from '@/lib/footballer-api';
import { toast } from 'sonner';

const api = vi.mocked(FootballerAPI);
const mockToast = vi.mocked(toast);

function pic(overrides = {}) {
  return {
    id: 1,
    footballer_id: 42,
    footballer_name: 'CR7',
    image_url: 'http://x/y.png',
    thumbnail_url: 'http://x/y_thumb.png',
    name: 'Headshot',
    slug: 'headshot',
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('PicturesEditor', () => {
  beforeEach(() => {
    api.getFootballerPictures.mockReset();
    api.uploadFootballerPicture.mockReset();
    api.patchFootballerPicture.mockReset();
    api.deleteFootballerPicture.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows empty state when no pictures exist', async () => {
    api.getFootballerPictures.mockResolvedValueOnce([]);
    render(<PicturesEditor footballerId={42} />);
    expect(await screen.findByText(/No pictures yet/)).toBeInTheDocument();
  });

  it('renders the gallery with active + inactive pictures', async () => {
    api.getFootballerPictures.mockResolvedValueOnce([
      pic({ id: 1, name: 'Headshot', is_active: true }),
      pic({ id: 2, name: 'Action', is_active: false, slug: 'action' }),
    ]);
    render(<PicturesEditor footballerId={42} />);

    expect(await screen.findByText('Headshot')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });

  it('Upload button is disabled until a file is picked', async () => {
    api.getFootballerPictures.mockResolvedValueOnce([]);
    render(<PicturesEditor footballerId={42} />);
    await screen.findByText(/No pictures yet/);
    expect(screen.getByRole('button', { name: /Upload/ })).toBeDisabled();
  });

  it('Upload sends the file + name to the API', async () => {
    const user = userEvent.setup();
    api.getFootballerPictures.mockResolvedValueOnce([]);
    api.uploadFootballerPicture.mockResolvedValueOnce(pic({ id: 5, name: 'New' }));
    api.getFootballerPictures.mockResolvedValueOnce([pic({ id: 5, name: 'New' })]);

    render(<PicturesEditor footballerId={42} />);
    await screen.findByText(/No pictures yet/);

    const file = new File([new Uint8Array([0xFF])], 'photo.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Picture file') as HTMLInputElement;
    await user.upload(fileInput, file);

    // Name should auto-default to the file's basename.
    const nameInput = screen.getByLabelText('Picture name') as HTMLInputElement;
    expect(nameInput.value).toBe('photo');
    await user.clear(nameInput);
    await user.type(nameInput, 'New Headshot');

    await user.click(screen.getByRole('button', { name: /Upload/ }));

    await waitFor(() => expect(api.uploadFootballerPicture).toHaveBeenCalledTimes(1));
    expect(api.uploadFootballerPicture).toHaveBeenCalledWith(42, 'New Headshot', file);
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled());
  });

  it('Toggling active calls PATCH with the inverted flag', async () => {
    const user = userEvent.setup();
    api.getFootballerPictures.mockResolvedValueOnce([pic({ id: 1, is_active: true })]);
    api.patchFootballerPicture.mockResolvedValueOnce(pic({ id: 1, is_active: false }));
    api.getFootballerPictures.mockResolvedValueOnce([pic({ id: 1, is_active: false })]);

    render(<PicturesEditor footballerId={42} />);
    await screen.findByText('Headshot');

    await user.click(screen.getByRole('button', { name: /Deactivate/ }));

    await waitFor(() =>
      expect(api.patchFootballerPicture).toHaveBeenCalledWith(1, { is_active: false }),
    );
  });

  it('Delete confirms then calls DELETE', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.getFootballerPictures.mockResolvedValueOnce([pic({ id: 99, name: 'Drop me' })]);
    api.deleteFootballerPicture.mockResolvedValueOnce(undefined as never);
    api.getFootballerPictures.mockResolvedValueOnce([]);

    render(<PicturesEditor footballerId={42} />);
    await screen.findByText('Drop me');
    await user.click(screen.getByLabelText('Delete Drop me'));

    await waitFor(() => expect(api.deleteFootballerPicture).toHaveBeenCalledWith(99));
  });
});
