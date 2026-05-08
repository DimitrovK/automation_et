'use client';

import { CheckCircle2, ImagePlus, Loader2, Trash2, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FootballerAPI } from '@/lib/footballer-api';
import type { FootballerPicture } from '@/types/player';

type Props = { footballerId: number };

/**
 * Manage the FootballerPicture set for one footballer.
 * - Upload (multipart, model auto-crops to 1024² and auto-slugs).
 * - Toggle ``is_active`` per picture (used by games when picking imagery).
 * - Delete a picture row.
 *
 * Renders pictures as a thumbnail grid; the active ones are
 * highlighted.
 */
export function PicturesEditor({ footballerId }: Props) {
  const [pics, setPics] = useState<FootballerPicture[]>([]);
  const [loading, setLoading] = useState(false);

  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [busyId, setBusyId] = useState<number | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await FootballerAPI.getFootballerPictures(footballerId);
      setPics(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load pictures');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footballerId]);

  function pickFile(file: File | null) {
    setUploadFile(file);
    if (file && !uploadName) {
      // Default the name to the file's basename without extension.
      const base = file.name.replace(/\.[^.]+$/, '');
      setUploadName(base);
    }
  }

  async function upload() {
    if (!uploadFile) {
      toast.error('Pick an image file first.');
      return;
    }
    const name = uploadName.trim() || uploadFile.name.replace(/\.[^.]+$/, '');
    setUploading(true);
    try {
      const created = await FootballerAPI.uploadFootballerPicture(footballerId, name, uploadFile);
      toast.success(`Uploaded "${created.name}"`);
      setUploadFile(null);
      setUploadName('');
      if (fileRef.current) fileRef.current.value = '';
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(pic: FootballerPicture) {
    setBusyId(pic.id);
    try {
      await FootballerAPI.patchFootballerPicture(pic.id, { is_active: !pic.is_active });
      toast.success(pic.is_active ? `Deactivated "${pic.name}"` : `Activated "${pic.name}"`);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update picture');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(pic: FootballerPicture) {
    if (!confirm(`Delete "${pic.name}"? This cannot be undone.`)) return;
    setBusyId(pic.id);
    try {
      await FootballerAPI.deleteFootballerPicture(pic.id);
      toast.success(`Deleted "${pic.name}"`);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete picture');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pictures</CardTitle>
        <CardDescription>
          Upload portraits for the games to use. Images are auto-cropped to 1024×1024
          and resized server-side. Use the active toggle to control which photos
          can appear in front of users.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload row */}
        <div className="rounded-md border bg-gray-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              className="h-10"
              aria-label="Picture file"
            />
            <Input
              placeholder="Name (e.g. Headshot 2024)"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              className="h-10 sm:w-64"
              aria-label="Picture name"
            />
            <Button
              onClick={upload}
              disabled={!uploadFile || uploading}
              className="h-10 border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700"
            >
              {uploading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <ImagePlus className="mr-1.5 size-4" />}
              Upload
            </Button>
          </div>
        </div>

        {/* Gallery */}
        {loading && pics.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" /> Loading pictures…
          </div>
        ) : pics.length === 0 ? (
          <div className="rounded-md border bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-slate-800/40">
            No pictures yet. Upload one above.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pics.map((pic) => (
              <div
                key={pic.id}
                className={
                  'group overflow-hidden rounded-md border transition '
                  + (pic.is_active
                    ? 'border-emerald-300 dark:border-emerald-700'
                    : 'border-gray-200 opacity-70 dark:border-slate-700')
                }
              >
                <div className="relative aspect-square bg-gray-100 dark:bg-slate-800">
                  {pic.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pic.thumbnail_url}
                      alt={pic.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xs text-gray-400">
                      no thumb
                    </div>
                  )}
                  <Badge
                    variant={pic.is_active ? 'default' : 'secondary'}
                    className={
                      'absolute left-2 top-2 '
                      + (pic.is_active
                        ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-300')
                    }
                  >
                    {pic.is_active ? 'active' : 'inactive'}
                  </Badge>
                </div>
                <div className="p-2 text-xs">
                  <div className="truncate font-medium" title={pic.name}>
                    {pic.name}
                  </div>
                  <div className="truncate text-gray-400">{pic.slug}</div>
                  <div className="mt-2 flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(pic)}
                      disabled={busyId === pic.id}
                      className="h-7 flex-1 px-2 text-xs"
                    >
                      {pic.is_active ? (
                        <><XCircle className="mr-1 size-3" /> Deactivate</>
                      ) : (
                        <><CheckCircle2 className="mr-1 size-3" /> Activate</>
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(pic)}
                      disabled={busyId === pic.id}
                      aria-label={`Delete ${pic.name}`}
                      className="h-7 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
