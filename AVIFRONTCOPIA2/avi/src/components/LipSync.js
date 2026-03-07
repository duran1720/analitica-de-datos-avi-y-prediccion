import { useEffect, useRef } from "react";

export default function useLipSync(audioRef, meshRef) {
  const rafRef = useRef(null);

  // Guardamos la cadena de audio para no recrearla ni reconectar el elemento
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    const el = audioRef?.current;
    const mesh = meshRef?.current;

    if (!el || !mesh) return;

    let cancelled = false;

    // 1) Crear o reutilizar AudioContext
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }

    const ctx = audioCtxRef.current;

    // 2) Conectar el elemento SOLO una vez
    // Si ya existe sourceRef, no volvemos a crear ni a conectar
    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(el);

      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 64;

      const analyser = analyserRef.current;
      sourceRef.current.connect(analyser);
      analyser.connect(ctx.destination);

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    // 3) En algunos navegadores, el AudioContext arranca "suspended"
    // Se reanuda cuando el usuario interactúa (click/play)
    const resume = async () => {
      try {
        if (ctx.state === "suspended") await ctx.resume();
      } catch {
        // ignore
      }
    };
    resume();

    const mouths = ["jawOpen", "mouthOpen", "vrc.v_aa", "vrc.v_ch", "vrc.v_dd"];

    function animate() {
      if (cancelled || !meshRef.current) return;

      analyser.getByteFrequencyData(dataArray);

      // promedio simple
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;

      const mouthOpen = Math.min(avg / 40, 1);

      const dict = meshRef.current.morphTargetDictionary;
      const infl = meshRef.current.morphTargetInfluences;

      if (dict && infl) {
        mouths.forEach((blend) => {
          const idx = dict[blend];
          if (idx !== undefined) infl[idx] = mouthOpen;
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef, meshRef]);
}