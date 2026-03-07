import { useEffect, useRef } from "react";

function findMorphTarget(source) {
  if (!source) return null;

  if (source.morphTargetDictionary && source.morphTargetInfluences) {
    return source;
  }

  let found = null;
  source.traverse?.((obj) => {
    if (!found && obj.morphTargetDictionary && obj.morphTargetInfluences) {
      found = obj;
    }
  });

  return found;
}

function findJawBone(source) {
  if (!source) return null;

  let found = null;
  source.traverse?.((obj) => {
    if (!found && obj.isBone) {
      const n = (obj.name || "").toLowerCase();
      if (n.includes("jaw") || n.includes("mouth") || n.includes("mandible")) {
        found = obj;
      }
    }
  });

  return found;
}

function findJawNode(source) {
  if (!source) return null;

  let found = null;
  source.traverse?.((obj) => {
    if (!found) {
      const n = (obj.name || "").toLowerCase();
      if (n.includes("jaw") || n.includes("mouth") || n.includes("mandible")) {
        found = obj;
      }
    }
  });

  return found;
}

function findFaceMesh(source) {
  if (!source) return null;

  let found = null;
  source.traverse?.((obj) => {
    if (!found && obj.isMesh) {
      const n = (obj.name || "").toLowerCase();
      if (
        n.includes("head") ||
        n.includes("face") ||
        n.includes("mouth") ||
        n.includes("cat")
      ) {
        found = obj;
      }
    }
  });

  if (found) return found;

  source.traverse?.((obj) => {
    if (!found && obj.isMesh) found = obj;
  });

  return found;
}

export default function useTalkingMouth(talkTarget, speaking) {
  const rafRef = useRef(0);

  useEffect(() => {
    if (!talkTarget) return;

    const morphMesh = findMorphTarget(talkTarget);
    const jawBone = findJawBone(talkTarget);
    const jawNode = findJawNode(talkTarget);
    const faceMesh = findFaceMesh(talkTarget);

    let mode = "none";
    let idx = undefined;
    let baseJawRotationX = 0;
    let baseScaleY = 1;

    if (morphMesh) {
      const dict = morphMesh.morphTargetDictionary;
      const candidates = ["jawOpen", "mouthOpen", "vrc.v_aa", "viseme_aa"];
      for (const name of candidates) {
        if (dict[name] !== undefined) {
          idx = dict[name];
          break;
        }
      }
      if (idx !== undefined) mode = "morph";
    }

    if (mode === "none" && jawBone) {
      mode = "jaw";
      baseJawRotationX = jawBone.rotation.x;
    }

    if (mode === "none" && jawNode) {
      mode = "jawNode";
      baseJawRotationX = jawNode.rotation.x;
    }

    if (mode === "none" && faceMesh) {
      mode = "meshPulse";
      baseScaleY = faceMesh.scale.y;
    }

    if (mode === "none") return;

    const t0 = performance.now();

    const loop = (t) => {
      if (!speaking) {
        if (mode === "morph" && morphMesh?.morphTargetInfluences && idx !== undefined) {
          morphMesh.morphTargetInfluences[idx] = 0;
        }
        if (mode === "jaw" && jawBone) {
          jawBone.rotation.x = baseJawRotationX;
        }
        if (mode === "jawNode" && jawNode) {
          jawNode.rotation.x = baseJawRotationX;
        }
        if (mode === "meshPulse" && faceMesh) {
          faceMesh.scale.y = baseScaleY;
        }
        return;
      }

      const dt = (t - t0) / 1000;
      const base = 0.08 + 0.08 * Math.sin(dt * 11.0);
      const pulse = 0.22 * Math.abs(Math.sin(dt * 6.8));
      const open = Math.min(base + pulse, 0.7);

      if (mode === "morph" && morphMesh?.morphTargetInfluences && idx !== undefined) {
        morphMesh.morphTargetInfluences[idx] = open;
      }

      if (mode === "jaw" && jawBone) {
        jawBone.rotation.x = baseJawRotationX - open * 0.45;
      }
      if (mode === "jawNode" && jawNode) {
        jawNode.rotation.x = baseJawRotationX - open * 0.35;
      }
      if (mode === "meshPulse" && faceMesh) {
        faceMesh.scale.y = baseScaleY - open * 0.06;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (mode === "morph" && morphMesh?.morphTargetInfluences && idx !== undefined) {
        morphMesh.morphTargetInfluences[idx] = 0;
      }
      if (mode === "jaw" && jawBone) {
        jawBone.rotation.x = baseJawRotationX;
      }
      if (mode === "jawNode" && jawNode) {
        jawNode.rotation.x = baseJawRotationX;
      }
      if (mode === "meshPulse" && faceMesh) {
        faceMesh.scale.y = baseScaleY;
      }
    };
  }, [talkTarget, speaking]);
}
