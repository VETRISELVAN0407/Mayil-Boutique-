import { useEffect, useRef, useState } from 'react';
import { prepareTryOnPhoto } from '../../utils/photo';
import CameraCapture from './CameraCapture';

/**
 * Upload or capture one photo. `photo` is { blob, previewUrl, landscape } from prepareTryOnPhoto (or null);
 * `onChange` is called with the prepared photo, or null when removed. Camera is offered only where the browser has one.
 */
export default function PhotoUploader({ photo, onChange, disabled = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const cameraSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  // Free the preview when it is replaced or the component goes away.
  const lastUrl = useRef(null);
  useEffect(() => {
    if (lastUrl.current && lastUrl.current !== photo?.previewUrl) URL.revokeObjectURL(lastUrl.current);
    lastUrl.current = photo?.previewUrl ?? null;
  }, [photo]);
  useEffect(() => () => { if (lastUrl.current) URL.revokeObjectURL(lastUrl.current); }, []);

  async function accept(file) {
    setError(null);
    setBusy(true);
    try {
      onChange(await prepareTryOnPhoto(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      setCamera(false);
    }
  }

  function handleSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) accept(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (disabled || busy) return;
    const file = e.dataTransfer.files?.[0];
    if (file) accept(file);
  }

  if (camera) {
    return <CameraCapture onCapture={accept} onClose={() => setCamera(false)} />;
  }

  if (photo) {
    return (
      <div className="rounded-xl bg-white p-4 ring-1 ring-[#E8E0D3]">
        <div className="mx-auto aspect-[3/4] max-h-[28rem] overflow-hidden rounded-lg bg-[#f4ecda]">
          <img src={photo.previewUrl} alt="Your photo preview" className="h-full w-full object-contain" />
        </div>
        {photo.landscape && (
          <p className="mt-3 text-center text-xs text-[#8a6d2f]">
            This photo is wide. A standing, full-body portrait photo gives a better preview.
          </p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="rounded-md border-2 border-[#0f3d2e] px-5 py-2 text-sm font-semibold text-[#0f3d2e] hover:bg-[#fdf8ee] disabled:opacity-50">
            Replace photo
          </button>
          {cameraSupported && (
            <button type="button" disabled={disabled} onClick={() => setCamera(true)} className="rounded-md border-2 border-[#0f3d2e] px-5 py-2 text-sm font-semibold text-[#0f3d2e] hover:bg-[#fdf8ee] disabled:opacity-50">
              Retake with camera
            </button>
          )}
          <button type="button" disabled={disabled} onClick={() => onChange(null)} className="px-3 py-2 text-sm text-brand-secondary underline hover:text-[#10241d] disabled:opacity-50">
            Remove
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSelect} className="sr-only" aria-label="Choose a replacement photo" />
        {error && <p role="alert" className="mt-3 text-center text-sm text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-[#0f3d2e] bg-[#fdf8ee]' : 'border-[#E3BF72] bg-white'}`}
      >
        <svg className="mx-auto" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#b08d47" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6" />
        </svg>
        <p className="mt-3 font-serif text-lg text-[#0f3d2e]">Add your photo</p>
        <p className="mt-1 text-xs text-brand-secondary">JPG, PNG or WebP. Drag it here or choose below.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={disabled || busy} onClick={() => inputRef.current?.click()} className="rounded-md bg-[#0f3d2e] px-6 py-2.5 font-semibold text-white hover:bg-[#0a2d22] disabled:opacity-50">
            {busy ? 'Preparing…' : 'Upload photo'}
          </button>
          {cameraSupported && (
            <button type="button" disabled={disabled || busy} onClick={() => setCamera(true)} className="rounded-md border-2 border-[#0f3d2e] px-6 py-2.5 font-semibold text-[#0f3d2e] hover:bg-[#fdf8ee] disabled:opacity-50">
              Take a photo
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSelect} className="sr-only" aria-label="Choose a photo" />
      </div>
      {error && <p role="alert" className="mt-3 text-center text-sm text-red-700">{error}</p>}
    </div>
  );
}
