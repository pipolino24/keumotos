"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, X, Loader2, Upload, AlertCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// browser-image-compression é ~70KB minified. Lazy-load: só baixa o
// bundle quando o user de fato seleciona uma imagem pra upload. Antes,
// toda página com ImageUpload (cadastro de moto, edição, aquisição)
// carregava esse chunk no first paint mesmo se ninguém clicasse upload.
let _compressionLib: typeof import("browser-image-compression") | null = null;
async function loadCompression() {
  if (_compressionLib) return _compressionLib.default;
  const mod = await import("browser-image-compression");
  _compressionLib = mod;
  return mod.default;
}

interface ImageUploadProps {
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
  maxSizeKB?: number;
  maxWidth?: number;
  quality?: number;
  shape?: "square" | "round";
  hint?: string;
  className?: string;
}

// Compressão default tunada pra catálogo de motos: 150KB em WebP a
// 1100px é suficiente pra galeria sem qualidade percebida pior (testado
// em iPhone 13 Retina). Base64 estoura 200KB no Mongo — em 6 fotos por
// moto, são ~1.2MB/doc no banco em vez de ~1.6MB. Economia ~25%.
const DEFAULT_MAX_SIZE_KB = 150;
const DEFAULT_MAX_WIDTH = 1100;
const DEFAULT_QUALITY = 0.72;

// Hard cap no arquivo original: 25MB. Acima disso (foto RAW, vídeo .mov
// renomeado, etc) o browser pode dar OOM tentando ler/comprimir.
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

// Vercel default request body é ~4.5MB. Base64 infla ~33% sobre o size
// real, então 3MB de base64 ≈ 4MB no wire + payload do form em volta.
// Mais conservador pra ter folga.
const MAX_TOTAL_PAYLOAD_BYTES = 3 * 1024 * 1024;

export function ImageUpload({
  value,
  onChange,
  max = 6,
  maxSizeKB = DEFAULT_MAX_SIZE_KB,
  maxWidth = DEFAULT_MAX_WIDTH,
  quality = DEFAULT_QUALITY,
  shape = "square",
  hint,
  className,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Tamanho corrente do payload (base64 = ~1.37x do binário). Usado pra
  // validar antes de adicionar — evita estourar limit de body do Vercel.
  const currentPayloadBytes = value.reduce((acc, src) => acc + src.length, 0);

  async function compressAndAdd(files: FileList | File[]) {
    if (loading) return; // bloqueia drops concorrentes durante compressão
    setError(null);
    const files_arr = Array.from(files);
    const remaining = max - value.length;

    if (remaining <= 0) {
      setError(`Limite de ${max} imagens atingido`);
      return;
    }

    // Triagem: avisa user sobre arquivos inválidos em vez de skipar silencioso.
    const validImages: File[] = [];
    const skipped: string[] = [];
    for (const f of files_arr) {
      if (!f.type.startsWith("image/")) {
        skipped.push(`${f.name} (tipo ${f.type || "desconhecido"})`);
        continue;
      }
      if (f.size > MAX_ORIGINAL_BYTES) {
        skipped.push(
          `${f.name} (${Math.round(f.size / 1024 / 1024)}MB — máx 25MB)`
        );
        continue;
      }
      validImages.push(f);
    }
    if (skipped.length > 0 && validImages.length === 0) {
      setError(`Não processei: ${skipped.join(", ")}`);
      return;
    }

    const toProcess = validImages.slice(0, remaining);
    setLoading(true);
    setProgress(0);

    try {
      const imageCompression = await loadCompression();
      const compressed: string[] = [];
      let totalOriginalBytes = 0;
      let totalCompressedBytes = 0;
      let payloadEstimate = currentPayloadBytes;
      let stoppedDueToPayload = 0;

      for (let i = 0; i < toProcess.length; i++) {
        const file = toProcess[i];
        totalOriginalBytes += file.size;
        const compressedFile = await imageCompression(file, {
          maxSizeMB: maxSizeKB / 1024,
          maxWidthOrHeight: maxWidth,
          useWebWorker: true,
          initialQuality: quality,
          fileType: "image/webp",
          // Permite ainda mais agressivo se imagem é > 5MB original
          // (foto direto da câmera) — usuário quer "leve" não "perfeito"
          alwaysKeepResolution: false,
          // onProgress de 0..100 por arquivo — combina com (i/N) pra dar
          // barra incremental real em vez de saltar 0→100.
          onProgress: (p: number) => {
            const base = (i / toProcess.length) * 100;
            const slice = p / toProcess.length;
            setProgress(Math.min(99, Math.round(base + slice)));
          },
        });
        totalCompressedBytes += compressedFile.size;
        const base64 = await imageCompression.getDataUrlFromFile(compressedFile);

        // Hard cap de payload pra não estourar body limit do Vercel
        // depois (request 413). Para na imagem que estouraria.
        if (payloadEstimate + base64.length > MAX_TOTAL_PAYLOAD_BYTES) {
          stoppedDueToPayload = toProcess.length - i;
          break;
        }
        payloadEstimate += base64.length;
        compressed.push(base64);
      }

      setProgress(100);
      onChange([...value, ...compressed]);

      if (stoppedDueToPayload > 0) {
        setError(
          `Adicionei ${compressed.length} imagem(ns). ${stoppedDueToPayload} ignorada(s) — payload total ficaria acima de ${Math.round(MAX_TOTAL_PAYLOAD_BYTES / 1024 / 1024)}MB`
        );
      } else if (skipped.length > 0) {
        setError(
          `${compressed.length} adicionada(s). Ignorei: ${skipped.join(", ")}`
        );
      }

      // Log de economia em dev — útil pra calibrar config futuramente.
      if (totalOriginalBytes > 0 && process.env.NODE_ENV === "development") {
        const economia = Math.round(
          ((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) *
            100
        );
        console.debug(
          `[image-upload] ${Math.round(totalOriginalBytes / 1024)}KB → ${Math.round(totalCompressedBytes / 1024)}KB (-${economia}%)`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `Erro ao processar imagem: ${err.message}`
          : "Erro ao processar imagem. Tente outro arquivo."
      );
    } finally {
      setLoading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      compressAndAdd(e.target.files);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      compressAndAdd(e.dataTransfer.files);
    }
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function setAsCover(idx: number) {
    if (idx <= 0 || idx >= value.length) return;
    const reordered = [value[idx], ...value.filter((_, i) => i !== idx)];
    onChange(reordered);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        onChange={handleFileInput}
        className="hidden"
        disabled={loading}
      />

      {/* Grade de previews */}
      {value.length > 0 && (
        <div
          className={cn(
            "grid gap-3",
            shape === "round"
              ? "grid-cols-1"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          )}
        >
          {value.map((src, idx) => (
            <div
              key={idx}
              className={cn(
                "relative group overflow-hidden bg-keu-gray-light border border-keu-black/10",
                shape === "round"
                  ? "rounded-full w-24 h-24"
                  : "rounded-xl aspect-square"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Imagem ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 0 && shape === "square" && (
                <div className="absolute top-2 left-2 bg-keu-red text-white text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shadow-lg">
                  <Star className="h-2.5 w-2.5 fill-white" />
                  Capa
                </div>
              )}
              {idx > 0 && shape === "square" && (
                <button
                  type="button"
                  onClick={() => setAsCover(idx)}
                  title="Definir como capa"
                  aria-label="Definir como capa"
                  className="absolute top-2 left-2 bg-white/90 hover:bg-keu-red hover:text-white text-keu-black w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                title="Remover foto"
                aria-label="Remover foto"
                className="absolute top-2 right-2 bg-white/90 hover:bg-red-500 hover:text-white text-keu-black w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botão de upload */}
      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            if (!loading) setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!loading && !dragOver) setDragOver(true);
          }}
          onDragLeave={(e) => {
            // Só desliga se realmente saiu (relatedTarget fora do botão)
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDrop={handleDrop}
          disabled={loading}
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer",
            loading
              ? "border-keu-red/40 bg-keu-red/5"
              : dragOver
              ? "border-keu-red bg-keu-red/10 scale-[1.01]"
              : "border-keu-black/15 hover:border-keu-red hover:bg-keu-red/5"
          )}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 text-keu-red animate-spin" />
              <div className="text-sm font-semibold text-keu-red">
                Comprimindo... {progress}%
              </div>
              <div className="w-32 h-1 bg-keu-red/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-keu-red transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {shape === "round" ? (
                <ImageIcon className="h-6 w-6 text-keu-black/30 mx-auto mb-1.5" />
              ) : (
                <Upload className="h-7 w-7 text-keu-black/30 mx-auto mb-2" />
              )}
              <div className="text-sm font-semibold">
                {value.length === 0
                  ? "Clique ou arraste imagens"
                  : `Adicionar mais ${value.length}/${max}`}
              </div>
              <div className="text-xs text-keu-black/50 mt-1">
                {hint ?? `Auto-comprimido para ~${maxSizeKB}KB (WebP)`}
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {value.length > 0 && (
        <div className="text-xs text-keu-black/50 flex items-center justify-between gap-2">
          <span>
            {value.length} de {max} imagens
          </span>
          <span className={cn(
            "tabular-nums",
            currentPayloadBytes > MAX_TOTAL_PAYLOAD_BYTES * 0.8 && "text-amber-700",
            currentPayloadBytes > MAX_TOTAL_PAYLOAD_BYTES && "text-red-600 font-semibold"
          )}>
            {currentPayloadBytes > 1024 * 1024
              ? `${(currentPayloadBytes / 1024 / 1024).toFixed(2)} MB`
              : `${Math.round(currentPayloadBytes / 1024)} KB`}
            {" "}
            <span className="text-keu-black/30">
              / {Math.round(MAX_TOTAL_PAYLOAD_BYTES / 1024 / 1024)} MB
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
