"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createResource } from "@/lib/actions/resources";
import { FileIcon, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function DocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [pdfProcessor, setPdfProcessor] = useState<any>(null);

  useEffect(() => {
    import("@/lib/pdf-processor").then((mod) => {
      setPdfProcessor(() => mod.extractTextFromPDF);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      if (selectedFile.type !== "application/pdf") {
        toast.error("Por favor selecciona un archivo PDF");
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast.error("El archivo es demasiado grande. Máximo 10MB.");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    setIsUploading(true);

    try {
      // Extraer texto del PDF en el cliente
      toast.info("Procesando PDF...");
      const chunks = await pdfProcessor(file);

      if (chunks.length === 0) {
        toast.error("No se pudo extraer texto del PDF");
        return;
      }

      toast.info(`Guardando ${chunks.length} secciones...`);

      // Guardar cada chunk
      let saved = 0;
      for (const chunk of chunks) {
        try {
          await createResource({ content: chunk });
          saved++;
          // Actualizar progreso
          if (saved % 5 === 0) {
            toast.info(`Progreso: ${saved}/${chunks.length} secciones`);
          }
        } catch (error) {
          console.error("Error guardando chunk:", error);
        }
      }

      toast.success(`Documento procesado: ${saved} secciones guardadas`);

      // Limpiar
      setFile(null);
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error procesando PDF:", error);
      toast.error("Error al procesar el documento");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 border rounded-lg bg-card mb-4">
      <h3 className="text-lg font-semibold mb-4">Subir Documento PDF</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="flex-1"
          />
        </div>

        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileIcon className="w-4 h-4" />
            <span>
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>Procesando...</>
          ) : (
            <>
              <UploadIcon className="w-4 h-4 mr-2" />
              Subir PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
