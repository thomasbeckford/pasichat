"use client";

import * as pdfjsLib from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// Configurar el worker - IMPORTANTE: usa la ruta correcta
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";

export async function extractTextFromPDF(file: File): Promise<string[]> {
  try {
    console.log("Iniciando extracción de PDF...");
    const arrayBuffer = await file.arrayBuffer();

    // Cargar el documento PDF
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true, // Importante para algunos PDFs
    });

    const pdf = await loadingTask.promise;
    console.log(`PDF cargado: ${pdf.numPages} páginas`);

    const allText: string[] = [];

    // Extraer texto página por página
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Construir el texto de la página manteniendo la estructura
        let pageText = "";
        let lastY = -1;

        textContent.items.forEach((item) => {
          const textItem = item as TextItem;
          // Detectar saltos de línea basados en la posición Y
          if (lastY !== -1 && Math.abs(textItem.transform[5] - lastY) > 5) {
            pageText += "\n";
          }
          pageText += textItem.str;
          lastY = textItem.transform[5];
        });

        // Limpiar y normalizar el texto
        pageText = pageText
          .replace(/\s+/g, " ") // Normalizar espacios múltiples
          .replace(/\n{3,}/g, "\n\n") // Máximo 2 saltos de línea
          .trim();

        console.log(`Página ${pageNum}: ${pageText.substring(0, 100)}...`);

        if (pageText.length > 50) {
          allText.push(`[Página ${pageNum}]\n${pageText}`);
        }
      } catch (pageError) {
        console.error(`Error en página ${pageNum}:`, pageError);
      }
    }

    // Unir todo el texto y dividir en chunks apropiados
    const fullText = allText.join("\n\n");
    const chunks = splitIntoChunks(fullText);

    console.log(`Extracción completa: ${chunks.length} chunks creados`);
    return chunks;
  } catch (error) {
    console.error("Error extracting PDF:", error);
    throw new Error(
      "No se pudo procesar el PDF. Verifica que sea un PDF válido."
    );
  }
}

// Función auxiliar para dividir el texto en chunks manejables
function splitIntoChunks(
  text: string,
  maxChunkSize: number = 800,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = "";
  let startIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];

    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());

        // Crear overlap: retroceder algunas oraciones
        const overlapStart = Math.max(0, i - 2);
        currentChunk = sentences.slice(overlapStart, i).join(" ");
      }
    }

    currentChunk += " " + sentence;
  }

  if (currentChunk) chunks.push(currentChunk.trim());

  return chunks.filter((chunk) => chunk.length > 20); // Más permisivo
}
