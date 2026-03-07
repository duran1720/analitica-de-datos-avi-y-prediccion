import { useEffect } from "react";
export default function useBlink(meshRef) {
  useEffect(() => {
    let cancel = false;

    function blink() {
      if (cancel || !meshRef.current) return;

      const dict = meshRef.current.morphTargetDictionary;
      const infl = meshRef.current.morphTargetInfluences;

      const left = dict["eyesBlinkLeft"];
      const right = dict["eyesBlinkRight"];

      if (left !== undefined) infl[left] = 1;
      if (right !== undefined) infl[right] = 1;

      setTimeout(() => {
        if (left !== undefined) infl[left] = 0;
        if (right !== undefined) infl[right] = 0;
      }, 120);

      if (!cancel)
        setTimeout(blink, Math.random() * 2000 + 1500);
    }

    blink();

    return () => (cancel = true);
  }, [meshRef]);
}