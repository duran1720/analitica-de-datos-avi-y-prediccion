import { useEffect } from "react";

export default function useHeadMovement(modelRef) {
  useEffect(() => {
    function onMove(e) {
      if (!modelRef.current) return;

      const nx = (e.clientX / window.innerWidth - 0.5) * 0.5;
      const ny = (e.clientY / window.innerHeight - 0.5) * -0.3;

      modelRef.current.rotation.y = nx;
      modelRef.current.rotation.x = ny;
    }

    window.addEventListener("mousemove", onMove);

    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, [modelRef]);
}