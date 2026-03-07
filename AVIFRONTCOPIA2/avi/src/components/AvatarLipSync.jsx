import { useEffect, useRef } from "react";
import { AudioListener, Audio, AudioAnalyser } from "three";

export default function useLipSync(audioRef, meshRef) {
  const analyserRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const listener = new AudioListener();
    const audio = new Audio(listener);
    audio.setMediaElementSource(audioRef.current);

    const analyser = new AudioAnalyser(audio, 32);
    analyserRef.current = analyser;

    function animate() {
      if (!meshRef.current) return;

      const data = analyser.getAverageFrequency();
      const mouthOpen = Math.min(data / 80, 1);

      const mouths = [
        "jawOpen",
        "mouthOpen",
        "vrc.v_aa"
      ];

      mouths.forEach((blend) => {
        if (meshRef.current.morphTargetDictionary[blend] !== undefined) {
          const index = meshRef.current.morphTargetDictionary[blend];
          meshRef.current.morphTargetInfluences[index] = mouthOpen;
        }
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, [audioRef, meshRef]);

  return null;
}