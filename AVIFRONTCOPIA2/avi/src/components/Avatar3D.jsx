import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useState, useRef } from "react";
import * as THREE from "three";


import useLipSync from "./LipSync";
import useBlink from "./Blink";
import useHeadMovement from "./HeadMovement";
import { applyEmotion } from "./VTuberEngine";
import useTalkingMouth from "./TalkingMouth";

const AVATAR_URL =
  "https://models.readyplayer.me/699da146f005c9608f5ee8aa.glb";

export default function Avatar3D({ 
  emotion, 
  audioRef, 
  speaking,
  compact = false   // 👈 NUEVO
}) {
  return (
    <div
      style={{
        width: "100%",
        height: compact ? "260px" : "350px",  // 👈 dinámico
        margin: compact ? "0 auto" : "40px auto",
        borderRadius: "20px",
        overflow: "hidden",
      }}
    >
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ 
          fov: compact ? 35 : 28,  // 👈 más abierto en modo pequeño
          position: compact ? [0, 1.5, 1.4] : [0, 1.6, 0.9]
        }}
      >
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[2.5, 3.5, 2.5]} intensity={1.3} />
      <directionalLight position={[-2.0, 2.0, 1.5]} intensity={0.7} />
      <Environment preset="studio" />
      <AvatarModel emotion={emotion} audioRef={audioRef} speaking={speaking} />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
    </Canvas>
  </div>
);
}

function AvatarModel({ emotion, audioRef, speaking }) {
  const { scene } = useGLTF(AVATAR_URL);

  const modelRef = useRef(null);

  // ✅ guardamos el mesh real en state para que los hooks reaccionen
  const [mouthMesh, setMouthMesh] = useState(null);

  // buscar cabeza para encuadre
  const headObject = useMemo(() => {
    const names = ["Head", "mixamorigHead", "Wolf3D_Head", "Wolf3D_Head_Mesh"];
    for (const n of names) {
      const o = scene.getObjectByName(n);
      if (o) return o;
    }
    return null;
  }, [scene]);

  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const desiredCam = useRef(new THREE.Vector3());
  const fallbackDistance = useRef(1.4);

  useEffect(() => {
    // ✅ Prioridad: el mesh de ReadyPlayerMe suele llamarse Wolf3D_Head
    const direct =
      scene.getObjectByName("Wolf3D_Head") ||
      scene.getObjectByName("Wolf3D_Head_Mesh");

    if (direct && direct.morphTargetDictionary && direct.morphTargetInfluences) {
      setMouthMesh(direct);
      return;
    }

    // Fallback: busca un SkinnedMesh con morph targets y nombre de head/face
    let found = null;
    scene.traverse((obj) => {
      if (
        !found &&
        obj.isSkinnedMesh &&
        obj.morphTargetDictionary &&
        obj.morphTargetInfluences
      ) {
        const n = (obj.name || "").toLowerCase();
        if (n.includes("head") || n.includes("face") || n.includes("wolf3d")) {
          found = obj;
        }
      }
    });

    // Si no encontró por nombre, toma el primero con morph targets
    if (!found) {
      scene.traverse((obj) => {
        if (
          !found &&
          obj.isSkinnedMesh &&
          obj.morphTargetDictionary &&
          obj.morphTargetInfluences
        ) {
          found = obj;
        }
      });
    }

    setMouthMesh(found);

    scene.rotation.y = 0;

    // Ajuste de encuadre para modelos que no siguen naming de ReadyPlayerMe
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    fallbackDistance.current = Math.max(1.2, maxDim * 1.8);
    targetPos.current.copy(center);
  }, [scene]);

  // Cámara a rostro + hombros
  useFrame(() => {
    if (headObject) {
      headObject.getWorldPosition(targetPos.current);
    } else {
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      targetPos.current.copy(center);
    }

    const distance = headObject ? 1.38 : fallbackDistance.current;

    desiredCam.current.set(
      targetPos.current.x,
      targetPos.current.y + (headObject ? 0.02 : 0.15),
      targetPos.current.z + distance
    );

    camera.position.lerp(desiredCam.current, 0.25);
    camera.lookAt(
      targetPos.current.x,
      targetPos.current.y + 0.02,
      targetPos.current.z
    );
  });

  // ✅ Emoción sobre el mesh que realmente tiene morphs
  useEffect(() => {
    if (!mouthMesh) return;
    applyEmotion(mouthMesh, emotion);
  }, [mouthMesh, emotion]);

  // Parpadeo / cabeza
  useBlink({ current: mouthMesh });      // adapto a tu hook que esperaba ref
  useHeadMovement(modelRef);

  // LipSync real (si algún día hay audioRef con audio)
  useLipSync(audioRef, { current: mouthMesh });

  // ✅ Boca hablando (para speechSynthesis)
  useTalkingMouth(mouthMesh || scene, speaking);

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={1.55}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload(AVATAR_URL);
