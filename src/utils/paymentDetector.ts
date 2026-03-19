/**
 * Utilidad para detectar menciones de pagos en mensajes de chat
 */

export interface PaymentInfo {
  amount: number;
  description: string;
  payer?: string;
  category?: string;
}

/**
 * Detecta si un mensaje contiene información sobre un pago
 */
export const detectPayment = (message: string): PaymentInfo | null => {
  const lowerMessage = message.toLowerCase();
  
  // Patrones de detección de pagos
  const patterns = [
    // "He pagado 50€", "Pagué 30 euros", "Yo pagé 25€"
    /(?:he |yo |)\s*(?:pagado|pagué|pague)\s*(?:la |el |los |las |)?\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)/i,
    
    // "50€ de cena", "30 euros de gasolina"
    /(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)\s*(?:de|para|en|por)\s+(\w+)/i,
    
    // "Cuesta/Ha costado 50€"
    /(?:cuesta|costó|ha costado|costado)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)/i,
    
    // "Compré por 50€", "Gasté 30€"
    /(?:compré|gasté|gaste|he gastado)\s*(?:por |)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)/i,
    
    // "Me ha salido 50€", "Salió 30 euros"
    /(?:me ha salido|salió|ha salido)\s*(?:por |a |)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)/i,
    
    // "Son 50€", "Ha sido 30 euros"
    /(?:son|ha sido|fueron)\s*(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)/i,
    
    // Más flexible: cualquier número seguido de € o euros
    /(\d+(?:[.,]\d+)?)\s*(?:€|euros?|eur)(?!\d)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const amountStr = match[1].replace(',', '.');
      const amount = parseFloat(amountStr);
      
      if (amount > 0 && amount < 100000) { // Validación básica
        // Extraer descripción del mensaje
        let description = extractDescription(message, match[2]);
        
        // Detectar categoría del contexto
        const category = detectCategory(message);
        
        return {
          amount,
          description: description || 'Gasto',
          category,
        };
      }
    }
  }
  
  return null;
};

/**
 * Extrae una descripción del mensaje
 */
const extractDescription = (message: string, contextWord?: string): string => {
  if (contextWord) {
    return contextWord.charAt(0).toUpperCase() + contextWord.slice(1);
  }
  
  // Intentar extraer contexto del mensaje
  const descriptionPatterns = [
    /(?:de|para|en)\s+(?:la |el |los |las |)?(\w+(?:\s+\w+)?)/i,
    /(?:pagado|pagué|compré|gasté)\s+(?:la |el |los |las |)?(\w+(?:\s+\w+)?)/i,
  ];
  
  for (const pattern of descriptionPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const desc = match[1].trim();
      // Filtrar palabras comunes que no son descripciones útiles
      const commonWords = ['por', 'con', 'sin', 'entre', 'sobre'];
      if (!commonWords.includes(desc.toLowerCase())) {
        return desc.charAt(0).toUpperCase() + desc.slice(1);
      }
    }
  }
  
  return 'Gasto';
};

/**
 * Detecta la categoría basándose en palabras clave
 */
const detectCategory = (message: string): string | undefined => {
  const lowerMessage = message.toLowerCase();
  
  const categoryKeywords: { [key: string]: string[] } = {
    'food': ['cena', 'comida', 'desayuno', 'almuerzo', 'restaurante', 'bar', 'café', 'pizza', 'hamburguesa', 'sushi', 'tapas', 'menú'],
    'transport': ['gasolina', 'combustible', 'taxi', 'uber', 'bus', 'metro', 'tren', 'avión', 'vuelo', 'parking', 'peaje', 'transporte'],
    'accommodation': ['hotel', 'airbnb', 'alojamiento', 'hostal', 'casa', 'apartamento', 'habitación', 'noche'],
    'entertainment': ['entrada', 'entradas', 'cine', 'teatro', 'concierto', 'fiesta', 'discoteca', 'museo', 'parque', 'actividad'],
    'shopping': ['compra', 'tienda', 'supermercado', 'ropa', 'zapatos', 'regalo', 'souvenirs', 'farmacia'],
    'other': ['varios', 'diversos', 'otros', 'vario'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return category;
      }
    }
  }
  
  return undefined;
};

/**
 * Resalta las partes del mensaje que contienen información de pago
 */
export const highlightPaymentInMessage = (message: string): { text: string; isPayment: boolean }[] => {
  const paymentInfo = detectPayment(message);
  if (!paymentInfo) {
    return [{ text: message, isPayment: false }];
  }
  
  // Buscar la parte del mensaje que contiene el monto
  const amountPattern = new RegExp(`${paymentInfo.amount.toString().replace('.', '[.,]')}\\s*(?:€|euros?|eur)`, 'i');
  const match = message.match(amountPattern);
  
  if (match && match.index !== undefined) {
    const parts: { text: string; isPayment: boolean }[] = [];
    
    // Parte antes del pago
    if (match.index > 0) {
      parts.push({
        text: message.substring(0, match.index),
        isPayment: false,
      });
    }
    
    // Parte del pago (clickeable)
    parts.push({
      text: match[0],
      isPayment: true,
    });
    
    // Parte después del pago
    const endIndex = match.index + match[0].length;
    if (endIndex < message.length) {
      parts.push({
        text: message.substring(endIndex),
        isPayment: false,
      });
    }
    
    return parts;
  }
  
  return [{ text: message, isPayment: false }];
};
