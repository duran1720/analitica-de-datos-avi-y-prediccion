import { useEffect, useRef, useState } from "react";

export default function useSpeechRecognition() {
  const [texto, setTexto] = useState("");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState("");

  const recognitionRef = useRef(null);
  const retryRef = useRef(0);

  useEffect(() => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Speech) {
      setSpeechSupported(false);
      setSpeechError(
        "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge actualizado en localhost o https."
      );
      return;
    }

    const recognition = new Speech();
    recognition.lang = "es-ES";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setTexto(transcript);
      setListening(false);
      setSpeechError("");
      retryRef.current = 0;
    };

    recognition.onerror = (event) => {
      setListening(false);
      const err = event?.error || "unknown";

      if (err === "network" && retryRef.current < 2) {
        retryRef.current += 1;
        setSpeechError("");
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }, 350);
        return;
      }

      if (err === "aborted" || err === "no-speech") {
        setSpeechError("");
        return;
      }

      if (err === "not-allowed" || err === "service-not-allowed") {
        setSpeechError("Permiso de microfono bloqueado. Habilitalo en Edge.");
        return;
      }

      setSpeechError(`Error de voz (${err}). Revisa permisos del microfono.`);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onstart = () => {
      setSpeechError("");
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  async function ensureMicPermission() {
    if (!navigator?.mediaDevices?.getUserMedia) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      const errName = error?.name || "unknown";
      setSpeechError(
        `No se pudo activar el microfono (${errName}). Permite acceso en Edge.`
      );
      return false;
    }
  }

  async function startListening() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setSpeechError("Reconocimiento de voz no disponible en este navegador.");
      return;
    }

    const hasPermission = await ensureMicPermission();
    if (!hasPermission) return;

    setTexto("");
    setSpeechError("");
    retryRef.current = 0;
    setListening(true);

    try {
      recognition.start();
    } catch {
      setListening(false);
      setSpeechError(
        "No se pudo iniciar el microfono. Intenta de nuevo despues de hacer click en la pagina."
      );
    }
  }

  return {
    texto,
    listening,
    startListening,
    setTexto,
    speechSupported,
    speechError,
    setSpeechError,
  };
}
