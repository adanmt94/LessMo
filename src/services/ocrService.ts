/**
 * 🔍 Servicio de OCR con Google Vision API
 * Extrae información inteligente de tickets/recibos
 */

import * as FileSystem from 'expo-file-system';

// Tipos para los datos extraídos del ticket
export interface ReceiptData {
  total?: number;
  currency?: string;
  date?: Date;
  merchantName?: string;
  items?: ReceiptItem[];
  category?: string;
  confidence: number; // 0-1
}

export interface ReceiptItem {
  name: string;
  quantity?: number;
  price: number;
}

/**
 * Analiza una imagen de ticket usando Google Vision API
 * @param imageUri - URI local de la imagen
 * @returns Datos extraídos del ticket
 */
export async function analyzeReceipt(imageUri: string): Promise<ReceiptData> {
  try {
    console.log('📸 Analizando recibo con OCR...');

    // Convertir imagen a base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Google Vision API endpoint
    const API_KEY = process.env.GOOGLE_VISION_API_KEY || 'AIzaSyDUc5h9M2VqYQZx7fN8wP9kR5aL6tE3mJ0'; // Temporal - debe estar en .env
    const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
            {
              type: 'DOCUMENT_TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.responses || !data.responses[0]) {
      throw new Error('No se pudo analizar el recibo');
    }

    const textAnnotation = data.responses[0].fullTextAnnotation?.text || 
                          data.responses[0].textAnnotations?.[0]?.description || '';

    console.log('📝 Texto extraído:', textAnnotation);

    // Analizar el texto extraído
    const receiptData = parseReceiptText(textAnnotation);
    
    console.log('✅ Datos del recibo extraídos:', receiptData);
    
    return receiptData;

  } catch (error) {
    console.error('❌ Error en OCR:', error);
    
    // Fallback: análisis básico sin API
    return {
      confidence: 0,
    };
  }
}

/**
 * Parsea el texto extraído para encontrar información relevante
 */
function parseReceiptText(text: string): ReceiptData {
  const lines = text.split('\n').map(line => line.trim());
  
  let total: number | undefined;
  let currency = 'EUR';
  let date: Date | undefined;
  let merchantName: string | undefined;
  const items: ReceiptItem[] = [];
  let confidence = 0.7;

  // Detectar total (múltiples patrones)
  const totalPatterns = [
    /TOTAL[:\s]+([0-9]+[.,][0-9]{2})/i,
    /TOTAL\s*€?\s*([0-9]+[.,][0-9]{2})/i,
    /IMPORTE[:\s]+([0-9]+[.,][0-9]{2})/i,
    /AMOUNT[:\s]+([0-9]+[.,][0-9]{2})/i,
    /^TOTAL:\s*€?\s*([0-9]+[.,][0-9]{2})/i,
    /€\s*([0-9]+[.,][0-9]{2})\s*$/,
  ];

  for (const line of lines) {
    // Buscar total
    if (!total) {
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          total = parseFloat(match[1].replace(',', '.'));
          confidence = 0.9;
          break;
        }
      }
    }

    // Detectar fecha
    if (!date) {
      const datePatterns = [
        /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
        /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
      ];
      
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            // Intentar parsear la fecha
            const [_, part1, part2, part3] = match;
            date = new Date(`${part3}-${part2}-${part1}`);
            if (isNaN(date.getTime())) {
              date = undefined;
            }
          } catch (e) {
            // Ignorar error de fecha
          }
          break;
        }
      }
    }

    // Detectar nombre del comercio (usualmente primera línea o línea con texto largo)
    if (!merchantName && line.length > 5 && line.length < 50 && !line.match(/[0-9]{3,}/)) {
      merchantName = line;
    }

    // Detectar items individuales (formato: "Producto ... X.XX€" o "Producto X.XX")
    const itemPattern = /^([A-Za-zÀ-ÿ\s]+)\s+.*?([0-9]+[.,][0-9]{2})\s*€?$/;
    const itemMatch = line.match(itemPattern);
    if (itemMatch) {
      const itemName = itemMatch[1].trim();
      const itemPrice = parseFloat(itemMatch[2].replace(',', '.'));
      
      if (itemName.length > 2 && itemPrice > 0 && itemPrice < 1000) {
        items.push({
          name: itemName,
          price: itemPrice,
        });
      }
    }
  }

  // Si no encontramos total, buscar el número más grande
  if (!total) {
    const numbers: number[] = [];
    for (const line of lines) {
      const matches = line.match(/([0-9]+[.,][0-9]{2})/g);
      if (matches) {
        matches.forEach(match => {
          numbers.push(parseFloat(match.replace(',', '.')));
        });
      }
    }
    
    if (numbers.length > 0) {
      total = numbers.length === 1 ? numbers[0] : Math.max(...numbers);
      confidence = 0.5; // Baja confianza
    }
  }

  // Detectar categoría basada en el nombre del comercio
  const category = detectCategoryFromMerchant(merchantName || '', text);

  return {
    total,
    currency,
    date,
    merchantName,
    items: items.length > 0 ? items : undefined,
    category,
    confidence,
  };
}

/**
 * Detecta la categoría basándose en el nombre del comercio o contenido
 */
function detectCategoryFromMerchant(merchantName: string, fullText: string): string | undefined {
  const text = (merchantName + ' ' + fullText).toLowerCase();

  // Comida y restaurantes
  if (
    text.match(/restauran|cafe|bar|pizza|burger|sushi|food|comida|tapas|bistro|grill|kebab|mcdon|kfc/) ||
    text.match(/menu|bebida|cerveza|vino|postre/)
  ) {
    return 'food';
  }

  // Transporte
  if (
    text.match(/taxi|uber|cabify|bolt|metro|bus|tren|renfe|gasolina|parking|aparcamiento|peaje|toll/) ||
    text.match(/repsol|cepsa|bp|shell|avia/)
  ) {
    return 'transport';
  }

  // Alojamiento
  if (
    text.match(/hotel|hostel|airbnb|booking|alojamiento|apartamento|resort|inn/)
  ) {
    return 'accommodation';
  }

  // Entretenimiento
  if (
    text.match(/cine|teatro|museo|entrada|ticket|concierto|show|discoteca|club|parque|attraction/)
  ) {
    return 'entertainment';
  }

  // Compras
  if (
    text.match(/supermercado|mercadona|carrefour|dia|lidl|aldi|eroski|alcampo|tienda|shop|store|zara|h&m|decathlon/)
  ) {
    return 'shopping';
  }

  return undefined;
}

/**
 * Analiza un recibo SIN API (análisis local básico)
 * Útil para modo offline o cuando falla la API
 */
export async function analyzeReceiptOffline(imageUri: string): Promise<ReceiptData> {
  console.log('📸 Análisis offline del recibo (sin OCR)');
  
  // Por ahora retorna datos vacíos, pero podría usar OCR local como Tesseract
  return {
    confidence: 0,
  };
}

/**
 * Detecta si el texto contiene información de un ticket
 */
export function looksLikeReceipt(text: string): boolean {
  const receiptKeywords = [
    'total', 'importe', 'amount', 'subtotal', 'iva', 'tax',
    'fecha', 'date', 'ticket', 'recibo', 'factura', 'invoice',
    '€', 'eur', 'euro'
  ];

  const lowerText = text.toLowerCase();
  let matches = 0;

  for (const keyword of receiptKeywords) {
    if (lowerText.includes(keyword)) {
      matches++;
    }
  }

  return matches >= 2; // Al menos 2 keywords de recibo
}
