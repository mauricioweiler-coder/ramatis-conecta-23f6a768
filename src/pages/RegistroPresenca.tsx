import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Camera, CheckCircle, Loader2, UserCheck, RefreshCw, AlertCircle, Video } from "lucide-react";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/registro-presenca`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface Worker {
  id: string;
  full_name: string;
  profile_photo_url: string;
}

type PageState = "loading" | "ready" | "detecting" | "matched" | "registered" | "error";

export default function RegistroPresenca() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<PageState>("loading");
  const [statusMsg, setStatusMsg] = useState("Carregando modelos de reconhecimento facial...");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  const [matchedWorker, setMatchedWorker] = useState<Worker | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [sessionLinked, setSessionLinked] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [descriptorsReady, setDescriptorsReady] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatusMsg("Carregando modelos de reconhecimento facial...");
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        setStatusMsg("Modelos carregados. Buscando trabalhadores...");
      } catch (err) {
        console.error("Error loading models:", err);
        setState("error");
        setStatusMsg("Erro ao carregar modelos de reconhecimento facial.");
      }
    };
    loadModels();
  }, []);

  // Fetch workers once models are loaded
  useEffect(() => {
    if (!modelsLoaded) return;
    const fetchWorkers = async () => {
      try {
        const res = await fetch(FUNCTION_URL, {
          headers: { apikey: API_KEY },
        });
        if (!res.ok) throw new Error("Falha ao buscar trabalhadores");
        const data: Worker[] = await res.json();
        setWorkers(data);
        if (data.length === 0) {
          setState("error");
          setStatusMsg("Nenhum trabalhador com foto cadastrada encontrado.");
          return;
        }
        setStatusMsg(`Processando fotos de ${data.length} trabalhador(es)...`);
      } catch (err) {
        console.error("Error fetching workers:", err);
        setState("error");
        setStatusMsg("Erro ao buscar trabalhadores.");
      }
    };
    fetchWorkers();
  }, [modelsLoaded]);

  // Compute face descriptors for all workers
  useEffect(() => {
    if (!modelsLoaded || workers.length === 0) return;

    const computeDescriptors = async () => {
      const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

      for (const worker of workers) {
        try {
          const img = await faceapi.fetchImage(worker.profile_photo_url);
          const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            labeledDescriptors.push(
              new faceapi.LabeledFaceDescriptors(worker.id, [detection.descriptor])
            );
          }
        } catch (err) {
          console.warn(`Não foi possível processar foto de ${worker.full_name}:`, err);
        }
      }

      if (labeledDescriptors.length === 0) {
        setState("error");
        setStatusMsg("Nenhuma foto válida encontrada para reconhecimento.");
        return;
      }

      const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
      setFaceMatcher(matcher);
      setDescriptorsReady(true);
      setStatusMsg("Sistema pronto! Posicione seu rosto na câmera.");
    };

    computeDescriptors();
  }, [modelsLoaded, workers]);

  // Start camera once descriptors are ready
  useEffect(() => {
    if (!descriptorsReady) return;

    const startCamera = async () => {
      // Try multiple constraints in order of preference
      const constraintOptions = [
        { video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } },
        { video: { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 480 } } },
        { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
        { video: true },
      ];

      let stream: MediaStream | null = null;

      for (const constraints of constraintOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          console.warn("Camera attempt failed with constraints:", constraints, err);
        }
      }

      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure video plays (needed on some mobile browsers)
          videoRef.current.play().catch(() => {});
        }
        setState("ready");
      } else {
        console.error("All camera attempts failed");
        setState("error");
        setStatusMsg("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [descriptorsReady]);

  // Detect face and match
  const handleDetect = useCallback(async () => {
    if (!videoRef.current || !faceMatcher) return;

    setState("detecting");
    setStatusMsg("Detectando rosto...");
    setMatchedWorker(null);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setState("ready");
        setStatusMsg("Nenhum rosto detectado. Tente novamente.");
        toast.error("Nenhum rosto detectado. Posicione-se melhor na câmera.");
        return;
      }

      const match = faceMatcher.findBestMatch(detection.descriptor);

      if (match.label === "unknown") {
        setState("ready");
        setStatusMsg("Rosto não reconhecido. Tente novamente.");
        toast.error("Rosto não reconhecido. Verifique se sua foto está cadastrada.");
        return;
      }

      const matched = workers.find((w) => w.id === match.label);
      if (matched) {
        setMatchedWorker(matched);
        setState("matched");
        setStatusMsg(`Identificado: ${matched.full_name}`);
      }
    } catch (err) {
      console.error("Detection error:", err);
      setState("ready");
      setStatusMsg("Erro na detecção. Tente novamente.");
    }
  }, [faceMatcher, workers]);

  // Register attendance
  const handleRegister = useCallback(async () => {
    if (!matchedWorker) return;

    setIsRegistering(true);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: API_KEY,
        },
        body: JSON.stringify({ worker_id: matchedWorker.id }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.info(`${data.worker_name} já registrou presença hoje.`);
        setState("registered");
        setStatusMsg(`${data.worker_name} — presença já registrada hoje.`);
        setSessionLinked(false);
        return;
      }

      if (!res.ok) throw new Error(data.error || "Erro ao registrar");

      setSessionLinked(data.session_linked);
      setState("registered");
      setStatusMsg(`Presença registrada com sucesso!`);
      toast.success(
        data.session_linked
          ? `Presença de ${data.worker_name} vinculada à palestra de hoje!`
          : `Presença de ${data.worker_name} registrada (sem palestra vinculada).`
      );
    } catch (err: any) {
      console.error("Register error:", err);
      toast.error(err.message || "Erro ao registrar presença");
    } finally {
      setIsRegistering(false);
    }
  }, [matchedWorker]);

  // Reset for next person
  const handleReset = useCallback(() => {
    setMatchedWorker(null);
    setSessionLinked(false);
    setState("ready");
    setStatusMsg("Sistema pronto! Posicione seu rosto na câmera.");
  }, []);

  const isLoading = state === "loading";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Camera className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Registro de Presença</CardTitle>
          <p className="text-sm text-muted-foreground">Reconhecimento facial</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2 rounded-md border p-3">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {state === "ready" && <Video className="h-4 w-4 text-primary" />}
            {state === "detecting" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {state === "matched" && <UserCheck className="h-4 w-4 text-primary" />}
            {state === "registered" && <CheckCircle className="h-4 w-4 text-primary" />}
            {state === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
            <span className="text-sm">{statusMsg}</span>
          </div>

          {/* Camera */}
          <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center space-y-2">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Preparando sistema...</p>
                </div>
              </div>
            )}
          </div>

          {/* Matched worker info */}
          {matchedWorker && (state === "matched" || state === "registered") && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              {matchedWorker.profile_photo_url && (
                <img
                  src={matchedWorker.profile_photo_url}
                  alt={matchedWorker.full_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{matchedWorker.full_name}</p>
                {state === "registered" && (
                  <div className="flex gap-1 mt-1">
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Presença registrada
                    </Badge>
                    {sessionLinked && (
                      <Badge variant="secondary" className="text-xs">
                        Palestra vinculada
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {state === "ready" && (
              <Button className="w-full" size="lg" onClick={handleDetect}>
                <Camera className="mr-2 h-5 w-5" />
                Identificar Rosto
              </Button>
            )}

            {state === "matched" && (
              <>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleRegister}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-5 w-5" />
                  )}
                  Confirmar Presença
                </Button>
                <Button variant="outline" size="lg" onClick={handleReset}>
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </>
            )}

            {state === "registered" && (
              <Button className="w-full" size="lg" variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-5 w-5" />
                Próximo Trabalhador
              </Button>
            )}

            {state === "error" && (
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Tentar Novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground text-center max-w-md">
        Posicione seu rosto de frente para a câmera em um ambiente bem iluminado para melhor reconhecimento.
      </p>
    </div>
  );
}
