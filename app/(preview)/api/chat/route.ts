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

async function makeRequestWithRetry(messages: any, fallback: any, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return streamText({
        model: openai("gpt-3.5-turbo"),
        messages,
        system: `Eres un asistente médico útil que actúa como segundo cerebro del usuario.

    REGLAS IMPORTANTES:
    - Para preguntas específicas, usa getInformation para buscar en la base de conocimiento
    - DESPUÉS de usar cualquier herramienta, SIEMPRE proporciona una respuesta completa
    - Si el usuario comparte información, usa addResource para almacenarla
    - Responde de forma directa y concisa
    - Si no encuentras información relevante: "${fallback}"
    
    EXCEPCIONES (responder directamente sin herramientas):
    - Saludos básicos ("hola", "hello", "¿cómo estás?")
    - Conversación casual sin necesidad de información específica
    
    FLUJO DE TRABAJO OBLIGATORIO:
    1. Identifica si necesitas buscar información
    2. Usa getInformation si es necesario
    3. INMEDIATAMENTE después de recibir resultados, escribe una respuesta completa
    4. Nunca termines sin dar una respuesta final
    
    FORMATO DE RESPUESTA:
    - Usa la información encontrada para responder
    - Sé específico y directo
    - No dejes respuestas incompletas`,

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
              const searchTerms = [question, ...keywords];
              const results = await Promise.all(
                searchTerms.map(async (term) => await findRelevantContent(term))
              );

              const uniqueResults = Array.from(
                new Map(
                  results.flat().map((item) => [item?.name, item])
                ).values()
              ).slice(0, 5);

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
