// Improved system prompt for better information retrieval

const improvedSystemPrompt = `Eres un asistente médico inteligente que actúa como segundo cerebro del usuario.

COMPORTAMIENTO PRINCIPAL:
- SIEMPRE busca información cuando el usuario pregunta sobre medicamentos, tratamientos, condiciones médicas o términos de salud
- Usa múltiples estrategias de búsqueda si la primera no da resultados
- Proporciona respuestas completas basadas en la información encontrada
- Solo usa el fallback cuando genuinamente no hay información disponible

REGLAS DE BÚSQUEDA:
1. Para CUALQUIER término médico o medicamento: usa getInformation INMEDIATAMENTE
2. Si no encuentras resultados con el término exacto, prueba variaciones:
   - Nombres genéricos vs. nombres comerciales
   - Términos relacionados o sinónimos
   - Categorías del medicamento
3. Busca al menos 2-3 veces con diferentes términos antes de decir que no tienes información

FLUJO OBLIGATORIO PARA PREGUNTAS MÉDICAS:
1. Usuario pregunta sobre medicamento/condición → getInformation(término_exacto)
2. Si no hay resultados → getInformation(variación_del_término)
3. Si aún no hay resultados → getInformation(categoría_o_sinónimo)
4. Solo después de múltiples búsquedas → usar fallback si es necesario
5. SIEMPRE proporcionar respuesta completa basada en lo encontrado

EJEMPLOS DE BÚSQUEDAS MÚLTIPLES:
- "apretude" → buscar: "apretude", "cabotegravir", "prep injection", "hiv prevention injection"
- "ibuprofeno" → buscar: "ibuprofeno", "ibuprofen", "antiinflamatorio", "nsaid"

EXCEPCIONES (responder sin herramientas):
- Saludos básicos ("hola", "¿cómo estás?")
- Preguntas generales de conversación
- Instrucciones sobre cómo usar el sistema

FORMATO DE RESPUESTA:
- Sé específico y directo
- Incluye detalles relevantes (forma de administración, indicaciones, etc.)
- Si encuentras información parcial, compártela y busca más detalles
- Nunca digas "no está en mi base de conocimiento" sin haber buscado múltiples veces

RECORDATORIO CRÍTICO:
Tu trabajo es SER ÚTIL y encontrar información. Si un usuario insiste en que tienes la información, es porque probablemente la tienes pero no la has buscado correctamente. Prueba diferentes términos de búsqueda.`;

// Función para generar múltiples términos de búsqueda
const generateSearchTerms = (originalTerm: string): string[] => {
  const terms = [originalTerm.toLowerCase()];

  // Agregar variaciones comunes
  const variations: Record<string, string[]> = {
    apretude: ["cabotegravir", "prep injection", "hiv prevention", "vocabria"],
    advil: ["ibuprofeno", "ibuprofen", "antiinflamatorio"],
    tylenol: ["acetaminofen", "paracetamol", "acetaminophen"],
    prep: ["pre-exposure prophylaxis", "profilaxis pre-exposición"],
    truvada: ["emtricitabine", "tenofovir", "ftc", "tdf"],
    // Agregar más según tu base de datos
  };

  if (variations[originalTerm.toLowerCase()]) {
    terms.push(...variations[originalTerm.toLowerCase()]);
  }

  return terms;
};

// Función para obtener sinónimos médicos
const getMedicalSynonyms = (term: string): string[] => {
  const synonymMap: Record<string, string[]> = {
    dolor: ["pain", "ache", "molestia"],
    inflamacion: ["inflammation", "swelling", "hinchazón"],
    fiebre: ["fever", "temperature", "temperatura"],
    antibiotico: ["antibiotic", "antimicrobial", "antimicrobiano"],
  };

  return synonymMap[term.toLowerCase()] || [];
};

// Función para buscar progresivamente
const progressiveSearch = async (
  term: string,
  searchFunction: (query: string) => Promise<any>
): Promise<any> => {
  const searchTerms = generateSearchTerms(term);
  let results = null;

  for (const searchTerm of searchTerms) {
    console.log(`Buscando: ${searchTerm}`);
    results = await searchFunction(searchTerm);

    if (results && results.length > 0) {
      console.log(`Encontrado con término: ${searchTerm}`);
      break;
    }
  }

  return results;
};

// Objeto con estrategias de búsqueda mejoradas
const improvedSearchStrategy = {
  generateSearchTerms,
  getMedicalSynonyms,
  progressiveSearch,
};

// Ejemplo de implementación en el handler del chat
const improvedChatHandler = `
// Implementación práctica para tu herramienta getInformation
const tools = {
  getInformation: async ({ query }: { query: string }) => {
    // Usar búsqueda progresiva
    const searchTerms = generateSearchTerms(query);
    
    for (const term of searchTerms) {
      console.log(\`Buscando: \${term}\`);
      const results = await searchDatabase(term);
      
      if (results && results.length > 0) {
        return {
          found: true,
          data: results,
          searchTerm: term,
          originalQuery: query
        };
      }
    }
    
    return {
      found: false,
      searchTerms: searchTerms,
      originalQuery: query,
      message: \`No se encontró información para "\${query}" después de buscar: \${searchTerms.join(', ')}\`
    };
  },
  
  // Función auxiliar para buscar en tu base de datos
  searchDatabase: async (term: string) => {
    // Aquí va tu lógica de búsqueda actual
    // Ejemplo:
    try {
      const results = await yourDatabaseSearch(term);
      return results;
    } catch (error) {
      console.error(\`Error buscando \${term}:\`, error);
      return [];
    }
  }
};

// Uso en tu API route o función principal
export const handleChatMessage = async (message: string) => {
  // Si el mensaje contiene términos médicos, usar búsqueda mejorada
  const medicalKeywords = ['medicamento', 'pastilla', 'inyección', 'tratamiento', 'medicina'];
  const containsMedicalTerm = medicalKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  if (containsMedicalTerm || /^[a-zA-Z]{4,}$/.test(message.trim())) {
    // Probable nombre de medicamento, buscar agresivamente
    const results = await tools.getInformation({ query: message.trim() });
    return results;
  }
  
  // Manejar otros tipos de mensajes...
};
`;

export { improvedChatHandler, improvedSearchStrategy, improvedSystemPrompt };
