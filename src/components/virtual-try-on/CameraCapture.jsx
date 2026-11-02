import { useEffect, useRef, useState } from 'react';

const ERRORS = {
  NotAllowedError: 'Camera access was blocked. Allow the camera in your browser settings, or upload a photo instead.',
  SecurityError: 'Camera access was blocked. Allow the camera in your browser settings, or upload a photo instead.',
  NotFoundError: 'No camera was found on this device. You can upload a photo instead.',
  NotReadableError: 'The camera is being used by another app. Close it and try again, or upload a photo instead.',
};

/**
 * Live camera preview with capture / retake. The camera is released as soon as a photo is taken and whenever this
 * component leaves the screen. `onCapture` receives a JPEG File; `onClose` goes back to the upload options.
 */
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('user');
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [canSwitch, setCanSwitch] = useState(false);
  const [shot, setShot] = useState(null); // { file, url }

  useEffect(() => {
    if (shot) return undefined;
    let cancelled = false;
    setReady(false);
    setError(null);

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Your browser cannot open the camera here. You can upload a photo instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
        if (!cancelled) setCanSwitch(devices.filter((d) => d.kind === 'videoinput').length > 1);
      } catch (err) {
        if (!cancelled) setError(ERRORS[err?.name] ?? 'The camera could not be started. You can upload a photo instead.');
      }
    }
    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, shot]);

  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0); // saved un-mirrored, as the camera sees it
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Could not take the photo. Please try again.');
        return;
      }
      setShot({ file: new File([blob], 'camera.jpg', { type: 'image/jpeg' }), url: URL.createObjectURL(blob) });
    }, 'image/jpeg', 0.92);
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[#fdf8ee] p-6 text-center ring-1 ring-[#E8E0D3]" role="alert">
        <p className="text-sm text-[#10241d]">{error}</p>
        <button type="button" onClick={onClose} className="mt-4 rounded-md bg-[#0f3d2e] px-6 py-2.5 font-semibold text-white hover:bg-[#0a2d22]">
          Back to upload
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-black ring-1 ring-[#E8E0D3]">
      <div className="relative mx-auto aspect-[3/4] max-h-[70vh] w-full bg-black">
        {shot ? (
          <img src={shot.url} alt="Your captured photo" className="h-full w-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setReady(true)}
            aria-label="Camera preview"
            className={`h-full w-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`}
          />
        )}
        {!shot && !ready && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Starting camera…</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 bg-[#0f3d2e] p-4">
        {shot ? (
          <>
            <button type="button" onClick={() => setShot(null)} className="rounded-md border border-[#E3BF72] px-5 py-2.5 font-semibold text-[#E3BF72] hover:bg-white/10">
              Retake
            </button>
            <button type="button" onClick={() => onCapture(shot.file)} className="rounded-md bg-[#E3BF72] px-6 py-2.5 font-semibold text-[#10241d] hover:bg-[#d4ae5f]">
              Use this photo
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2.5 text-sm text-white/80 hover:text-white">
              Cancel
            </button>
            <button
              type="button"
              onClick={capture}
              disabled={!ready}
              aria-label="Capture photo"
              className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#E3BF72] bg-white disabled:opacity-40"
            >
              <span className="h-9 w-9 rounded-full bg-[#E3BF72]" />
            </button>
            {canSwitch ? (
              <button type="button" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))} className="rounded-md px-4 py-2.5 text-sm text-white/80 hover:text-white">
                Switch camera
              </button>
            ) : <span className="w-24" />}
          </>
        )}
      </div>
    </div>
  );
}
