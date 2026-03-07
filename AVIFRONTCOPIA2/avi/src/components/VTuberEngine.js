export function applyEmotion(mesh, emotion) {
  if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences)
    return;

  const dict = mesh.morphTargetDictionary;
  const infl = mesh.morphTargetInfluences;

  // 🔄 Resetear todos los morph targets a 0 antes de aplicar nueva emoción
  Object.keys(dict).forEach((key) => {
    const index = dict[key];
    if (index !== undefined) {
      infl[index] = 0;
    }
  });

  const set = (name, value) => {
    if (dict[name] !== undefined) {
      infl[dict[name]] = value;
    }
  };

  switch (emotion) {
    case "happy":
      set("mouthSmile", 1);
      set("cheekPuff", 0.3);
      set("jawOpen", 0.1);
      break;

    case "sad":
      set("mouthFrown", 1);
      set("browDownLeft", 0.5);
      set("browDownRight", 0.5);
      break;

    case "angry":
      set("browDownLeft", 1);
      set("browDownRight", 1);
      set("jawOpen", 0.2);
      break;

    case "surprised":
      set("jawOpen", 1);
      set("mouthSmile", 0.1);
      break;

    // ✅ NUEVA EMOCIÓN PARA CUANDO EL AVATAR ESTÁ HABLANDO
    case "talking":
      set("jawOpen", 0.2);
      set("mouthSmile", 0.2);
      break;

    case "neutral":
    default:
      // No aplicar nada adicional (ya fue reseteado arriba)
      break;
  }
}