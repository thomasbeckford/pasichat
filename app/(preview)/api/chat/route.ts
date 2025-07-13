import { createResource } from "@/lib/actions/resources";
import { findRelevantContent } from "@/lib/ai/embedding";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamText, tool } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
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

export async function POST(req: Request) {
  try {
    const {
      messages,
      fallback = "This questions are not in my knowledge base, please contact your doctor or a medical professional.",
    } = await req.json();

    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      messages,
      system: `Eres un asistente útil que actúa como segundo cerebro del usuario.

    REGLAS DE HERRAMIENTAS:
    - SIEMPRE usa getInformation antes de responder preguntas
    - Si el usuario comparte información personal, usa addResource para almacenarla
    - Para consultas complejas, usa múltiples herramientas en secuencia
    - SOLO responde usando información de las herramientas
    
    EXCEPCIONES (NO usar herramientas):
    - Saludos casuales ("hola", "hello", "¿cómo estás?")
    - Conversación básica sin necesidad de información específica
    
    RESPUESTAS:
    - Mantén respuestas cortas y concisas
    - Si no encuentras información relevante: ${fallback}
    - Usa razonamiento lógico con la información disponible
    - Si hay coincidencias parciales, sé creativo para deducir la respuesta
    
    FLUJO:
    1. Analiza si necesitas herramientas
    2. Usa getInformation para buscar contexto
    3. Responde basándote ÚNICAMENTE en los resultados
    4. Si es insuficiente, usa herramientas adicionales antes de responder
    
    Sé directo, útil y preciso.`,
      tools: {
        addResource: tool({
          description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
          parameters: z.object({
            content: z
              .string()
              .describe("the content or resource to add to the knowledge base"),
          }),
          execute: async ({ content }) => createResource({ content }),
        }),
        // add new document tool to upload documents
        addDocument: tool({
          description: `add a document to your knowledge base.`,
          parameters: z.object({
            content: z
              .string()
              .describe("the content or resource to add to the knowledge base"),
          }),
          execute: async ({ content }) => createResource({ content }),
        }),
        getInformation: tool({
          description: `get information from your knowledge base to answer questions.`,
          parameters: z.object({
            question: z.string().describe("the users question"),
            similarQuestions: z
              .array(z.string())
              .describe("keywords to search"),
          }),
          execute: async ({ similarQuestions }) => {
            const results = await Promise.all(
              similarQuestions.map(
                async (question) => await findRelevantContent(question)
              )
            );
            // Flatten the array of arrays and remove duplicates based on 'name'
            const uniqueResults = Array.from(
              new Map(results.flat().map((item) => [item?.name, item])).values()
            );
            return uniqueResults;
          },
        }),
        understandQuery: tool({
          description: `understand the users query. use this tool on every prompt.`,
          parameters: z.object({
            query: z.string().describe("the users query"),
            toolsToCallInOrder: z
              .array(z.string())
              .describe(
                "these are the tools you need to call in the order necessary to respond to the users query"
              ),
          }),
          execute: async ({ query }) => {
            const { object } = await generateObject({
              model: openai("gpt-3.5-turbo"),
              system:
                "You are a query understanding assistant. Analyze the user query and generate similar questions.",
              schema: z.object({
                questions: z
                  .array(z.string())
                  .max(3)
                  .describe(
                    "similar questions to the user's query. be concise."
                  ),
              }),
              prompt: `Analyze this query: "${query}". Provide the following:
                    3 similar questions that could help answer the user's query`,
            });
            return object.questions;
          },
        }),
      },
    });

    return result.toDataStreamResponse({
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      getErrorMessage: (error) => {
        console.error("Stream error:", error);

        if (error instanceof Error) {
          return `Error: ${error.message}`;
        }
        return "Error procesando la solicitud";
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
