"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createResource } from "@/lib/actions/resources";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface UploadState {
  status: "idle" | "processing" | "uploading" | "success" | "error";
  progress: number;
  processedChunks: number;
  totalChunks: number;
  error?: string;
}

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    processedChunks: 0,
    totalChunks: 0,
  });
  const [pdfProcessor, setPdfProcessor] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    import("@/lib/pdf-processor").then((mod) => {
      setPdfProcessor(() => mod.extractTextFromPDF);
    });
  }, []);

  const resetState = useCallback(() => {
    setFile(null);
    setUploadState({
      status: "idle",
      progress: 0,
      processedChunks: 0,
      totalChunks: 0,
    });
  }, []);

  const validateFile = (selectedFile: File): boolean => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.error("El archivo es demasiado grande. Máximo 10MB");
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setUploadState((prev) => ({ ...prev, status: "idle", error: undefined }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setUploadState((prev) => ({ ...prev, status: "idle", error: undefined }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!file || !pdfProcessor) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    try {
      setUploadState((prev) => ({
        ...prev,
        status: "processing",
        progress: 10,
      }));

      const chunks = await pdfProcessor(file);

      if (chunks.length === 0) {
        throw new Error("No se pudo extraer texto del PDF");
      }

      setUploadState((prev) => ({
        ...prev,
        status: "uploading",
        totalChunks: chunks.length,
        progress: 20,
      }));

      let saved = 0;
      for (const chunk of chunks) {
        try {
          await createResource({ content: chunk });
          saved++;

          const progress = 20 + (saved / chunks.length) * 80;
          setUploadState((prev) => ({
            ...prev,
            processedChunks: saved,
            progress: Math.round(progress),
          }));
        } catch (error) {
          console.error("Error guardando chunk:", error);
        }
      }

      setUploadState((prev) => ({
        ...prev,
        status: "success",
        progress: 100,
      }));

      toast.success(
        `Documento procesado exitosamente: ${saved} secciones guardadas`
      );

      // Reset después de 3 segundos
      setTimeout(resetState, 3000);
    } catch (error) {
      console.error("Error procesando PDF:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al procesar el documento";

      setUploadState((prev) => ({
        ...prev,
        status: "error",
        error: errorMessage,
      }));

      toast.error(errorMessage);
    }
  };

  const removeFile = () => {
    resetState();
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case "processing":
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (uploadState.status) {
      case "processing":
        return "Extrayendo texto del PDF...";
      case "uploading":
        return `Guardando secciones (${uploadState.processedChunks}/${uploadState.totalChunks})`;
      case "success":
        return "¡Documento procesado exitosamente!";
      case "error":
        return uploadState.error || "Error al procesar";
      default:
        return "Listo para procesar";
    }
  };

  const isProcessing =
    uploadState.status === "processing" || uploadState.status === "uploading";

  return (
    <Card className="w-full max-w-md mx-auto mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Upload PDF Document
        </CardTitle>
        <CardDescription>
          Drag and drop a PDF file or click to select
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragOver && "border-primary bg-primary/5",
            !isDragOver &&
              "border-muted-foreground/25 hover:border-muted-foreground/50",
            isProcessing && "pointer-events-none opacity-50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() =>
            !isProcessing && document.getElementById("file-upload")?.click()
          }
        >
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="hidden"
          />

          <div className="space-y-2">
            <UploadIcon className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {file
                ? "Click to change file"
                : "Drag and drop a PDF here or click to select"}
            </p>
            <p className="text-xs text-muted-foreground">Max 10MB</p>
          </div>
        </div>

        {/* File Info */}
        {file && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 flex-1">
              {getStatusIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Badge
                variant={
                  uploadState.status === "success" ? "default" : "secondary"
                }
              >
                {uploadState.status === "idle" && "Listo"}
                {uploadState.status === "processing" && "Procesando"}
                {uploadState.status === "uploading" && "Subiendo"}
                {uploadState.status === "success" && "Completado"}
                {uploadState.status === "error" && "Error"}
              </Badge>
            </div>

            {!isProcessing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="ml-2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <Progress value={uploadState.progress} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              {getStatusText()}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {uploadState.status === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadState.error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {uploadState.status === "success" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Document processed successfully. {uploadState.processedChunks}{" "}
              sections saved.
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!file || isProcessing || uploadState.status === "success"}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {uploadState.status === "processing"
                ? "Processing..."
                : "Uploading..."}
            </>
          ) : uploadState.status === "success" ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            <>
              <UploadIcon className="w-4 h-4 mr-2" />
              Process PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
