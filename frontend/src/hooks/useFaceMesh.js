import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Mapeamento dos 9 pontos anatômicos a partir dos 468 landmarks do MediaPipe FaceMesh.
 */
const LANDMARK_MAP = {
  trichion:          10,
  glabella:           8,
  subnasale_front:    2,
  menton_front:     152,
  subnasale_profile:  2,
  pranasale:          1,
  labiale_superius:  13,
  labiale_inferius:  14,
  menton_profile:   152,
};

// Face width must be between 35% and 45% of video width for "ideal" distance
const DISTANCE_MIN_RATIO = 0.35;
const DISTANCE_MAX_RATIO = 0.45;
const IDEAL_CAPTURE_DELAY_MS = 1500;

export function useFaceMesh(videoRef, canvasRef) {
  const [faceDetected, setFaceDetected] = useState(false);
  const [points, setPoints] = useState(null);
  const [boundingBox, setBoundingBox] = useState(null);
  const [distanceStatus, setDistanceStatus] = useState('no-face');
  const [isTrackingVisible, setIsTrackingVisible] = useState(true);

  const faceMeshRef = useRef(null);
  const rafRef = useRef(null);
  const lastPointsRef = useRef(null);
  const idealTimerRef = useRef(null);
  const onAutoCaptureRef = useRef(null);

  const setOnAutoCapture = useCallback((cb) => {
    onAutoCaptureRef.current = cb;
  }, []);

  const resetTracking = useCallback(() => {
    setIsTrackingVisible(true);
    setDistanceStatus('no-face');
    if (idealTimerRef.current) {
      clearTimeout(idealTimerRef.current);
      idealTimerRef.current = null;
    }
  }, []);

  const computeBoundingBox = useCallback((landmarks, videoW, videoH) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const lm of landmarks) {
      const px = lm.x * videoW;
      const py = lm.y * videoH;
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, []);

  const getDistanceStatus = useCallback((faceWidth, videoWidth) => {
    const ratio = faceWidth / videoWidth;
    if (ratio < DISTANCE_MIN_RATIO) return 'too-far';
    if (ratio > DISTANCE_MAX_RATIO) return 'too-close';
    return 'ideal';
  }, []);

  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      if (!faceMeshRef.current) {
        const { FaceMesh } = await import('@mediapipe/face_mesh');
        const { Camera } = await import('@mediapipe/camera_utils');

        faceMeshRef.current = new FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMeshRef.current.onResults((results) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            const w = video.videoWidth;
            const h = video.videoHeight;

            const detected = {};
            for (const [key, idx] of Object.entries(LANDMARK_MAP)) {
              const lm = landmarks[idx];
              detected[key] = { x: lm.x * w, y: lm.y * h };
            }

            lastPointsRef.current = detected;
            setPoints(detected);
            setFaceDetected(true);

            const bbox = computeBoundingBox(landmarks, w, h);
            setBoundingBox(bbox);

            const status = getDistanceStatus(bbox.width, w);
            setDistanceStatus(status);

            if (canvasRef.current && isTrackingVisible) {
              const ctx = canvasRef.current.getContext('2d');
              canvasRef.current.width = w;
              canvasRef.current.height = h;
              ctx.clearRect(0, 0, w, h);

              const strokeColor = status === 'ideal' ? '#22c55e' : status === 'too-far' ? '#ef4444' : '#f59e0b';
              ctx.strokeStyle = strokeColor;
              ctx.lineWidth = 3;
              ctx.setLineDash([]);
              ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);

              const cornerLen = 20;
              ctx.lineWidth = 4;
              ctx.strokeStyle = strokeColor;
              ctx.beginPath();
              ctx.moveTo(bbox.x, bbox.y + cornerLen);
              ctx.lineTo(bbox.x, bbox.y);
              ctx.lineTo(bbox.x + cornerLen, bbox.y);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(bbox.x + bbox.width - cornerLen, bbox.y);
              ctx.lineTo(bbox.x + bbox.width, bbox.y);
              ctx.lineTo(bbox.x + bbox.width, bbox.y + cornerLen);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(bbox.x, bbox.y + bbox.height - cornerLen);
              ctx.lineTo(bbox.x, bbox.y + bbox.height);
              ctx.lineTo(bbox.x + cornerLen, bbox.y + bbox.height);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(bbox.x + bbox.width - cornerLen, bbox.y + bbox.height);
              ctx.lineTo(bbox.x + bbox.width, bbox.y + bbox.height);
              ctx.lineTo(bbox.x + bbox.width, bbox.y + bbox.height - cornerLen);
              ctx.stroke();

              ctx.font = 'bold 16px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = strokeColor;
              const labelText = status === 'ideal' ? '✓ Distancia ideal' : status === 'too-far' ? 'Aproxime-se' : 'Afaste-se';
              ctx.fillText(labelText, bbox.centerX, bbox.y - 12);
            }

            if (status === 'ideal') {
              if (!idealTimerRef.current) {
                idealTimerRef.current = setTimeout(() => {
                  setIsTrackingVisible(false);
                  idealTimerRef.current = null;
                  if (onAutoCaptureRef.current) {
                    onAutoCaptureRef.current();
                  }
                }, IDEAL_CAPTURE_DELAY_MS);
              }
            } else {
              if (idealTimerRef.current) {
                clearTimeout(idealTimerRef.current);
                idealTimerRef.current = null;
              }
            }
          } else {
            setFaceDetected(false);
            setBoundingBox(null);
            setDistanceStatus('no-face');
            if (idealTimerRef.current) {
              clearTimeout(idealTimerRef.current);
              idealTimerRef.current = null;
            }
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          }
        });

        const camera = new Camera(video, {
          onFrame: async () => {
            if (faceMeshRef.current) {
              await faceMeshRef.current.send({ image: video });
            }
          },
          width: 1280,
          height: 720,
        });
        camera.start();
      }
    } catch (err) {
      console.warn('MediaPipe FaceMesh indisponível:', err.message);
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, canvasRef, computeBoundingBox, getDistanceStatus, isTrackingVisible]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (idealTimerRef.current) clearTimeout(idealTimerRef.current);
    };
  }, [processFrame]);

  const getPoints = useCallback(() => {
    return lastPointsRef.current;
  }, []);

  return {
    faceDetected,
    points,
    boundingBox,
    distanceStatus,
    isTrackingVisible,
    getPoints,
    setOnAutoCapture,
    resetTracking,
  };
}
