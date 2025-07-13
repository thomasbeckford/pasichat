import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";
import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 30;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": `${process.env.NEXT_PUBLIC_URL}`,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

const generateSearchTerms = (originalTerm: string): string[] => {
  const terms = [originalTerm.toLowerCase()];

  const variations: Record<string, string[]> = {
    apretude: ["cabotegravir", "prep injection", "hiv prevention", "vocabria"],
    prep: ["pre-exposure prophylaxis", "profilaxis pre-exposición"],
    truvada: ["emtricitabine", "tenofovir", "ftc", "tdf"],
    advil: ["ibuprofeno", "ibuprofen", "antiinflamatorio"],
    tylenol: ["acetaminofen", "paracetamol", "acetaminophen"],
  };

  if (variations[originalTerm.toLowerCase()]) {
    terms.push(...variations[originalTerm.toLowerCase()]);
  }

  return terms;
};

async function makeRequestWithRetry(messages: any, fallback: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return streamText({
        model: openai("gpt-3.5-turbo"),
        messages,
        system: `Eres un asistente médico inteligente que actúa como segundo cerebro del usuario.

        COMPORTAMIENTO PRINCIPAL:
        - SIEMPRE busca información cuando el usuario pregunta sobre medicamentos, tratamientos, condiciones médicas o términos de salud
        - Usa múltiples estrategias de búsqueda si la primera no da resultados
        - Proporciona respuestas completas basadas en la información encontrada
        - Solo usa el fallback cuando genuinamente no hay información disponible
        
        REGLAS DE BÚSQUEDA:
        1. Para CUALQUIER término médico o medicamento: usa getInformation INMEDIATAMENTE
        2. Si no encuentras resultados con el término exacto, prueba variaciones automáticamente
        3. Busca al menos 2-3 veces con diferentes términos antes de decir que no tienes información
        
        FLUJO OBLIGATORIO PARA PREGUNTAS MÉDICAS:
        1. Usuario pregunta sobre medicamento/condición → getInformation(término_exacto)
        2. Si no hay resultados suficientes → getInformation(variaciones)
        3. SIEMPRE proporcionar respuesta completa basada en lo encontrado
        
        EXCEPCIONES (responder sin herramientas):
        - Saludos básicos ("hola", "¿cómo estás?")
        - Preguntas generales de conversación
        
        FORMATO DE RESPUESTA:
        - Sé específico y directo
        - Incluye detalles relevantes (forma de administración, indicaciones, etc.)
        - Si encuentras información parcial, compártela
        - Nunca digas "no está en mi base de conocimiento" sin haber buscado múltiples veces
        
        RECORDATORIO CRÍTICO:
        Tu trabajo es SER ÚTIL y encontrar información. Si un usuario insiste en que tienes la información, es porque probablemente la tienes pero no la has buscado correctamente.`,

        tools: {
          addResource: tool({
            description: "Agregar recurso a la base de conocimiento",
            parameters: z.object({
              content: z.string().describe("contenido a agregar"),
            }),
            execute: async ({ content }) => createResource({ content }),
          }),

          getInformation: tool({
            description: "Buscar información en la base de conocimiento",
            parameters: z.object({
              question: z.string().describe("pregunta del usuario"),
              keywords: z
                .array(z.string())
                .describe("palabras clave para buscar"),
            }),
            execute: async ({ question, keywords }) => {
              // Generar términos de búsqueda expandidos
              const allTerms = new Set([question, ...keywords]);

              // Agregar variaciones para cada término
              [...allTerms].forEach((term) => {
                const variations = generateSearchTerms(term);
                variations.forEach((variation) => allTerms.add(variation));
              });

              const searchTerms = Array.from(allTerms);
              console.log(`Buscando con términos: ${searchTerms.join(", ")}`);

              const results = await Promise.all(
                searchTerms.map(async (term) => await findRelevantContent(term))
              );

              const uniqueResults = Array.from(
                new Map(
                  results.flat().map((item) => [item?.name, item])
                ).values()
              ).slice(0, 8); // Aumentado de 5 a 8 para más resultados

              console.log(
                `Encontrados ${uniqueResults.length} resultados únicos`
              );
              return uniqueResults;
            },
          }),
        },
      });
    } catch (error) {
      if (
        (error as Error)?.message?.includes("rate limit") &&
        i < retries - 1
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
        continue;
      }
      throw error;
    }
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      fallback = "Esta pregunta no está en mi base de conocimiento, por favor contacta a tu médico o profesional de la salud.",
    } = await req.json();

    const result = await makeRequestWithRetry(messages, fallback);

    return result?.toDataStreamResponse({
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      getErrorMessage: (error) => {
        console.error("Stream error:", error);
        return error instanceof Error
          ? `Error: ${error.message}`
          : "Error procesando la solicitud";
      },
    });
  } catch (error) {
    console.error("API Route error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
