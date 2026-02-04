/**
 * 📡 api.ts
 * =========================================================
 * 🌐 Capa de comunicación con el backend OCR (INE/IFE).
 *
 * Este archivo centraliza TODAS las llamadas HTTP hacia el API,
 * evitando que los componentes React conozcan detalles de:
 * - URLs
 * - Headers
 * - FormData
 * - responseType
 *
 * 🧠 Patrón aplicado:
 * - Service Layer / API Client
 *
 * 📘 Estilo de documentación:
 * - AngularDoc / JSDoc
 * - Muchísimos emojis 😄
 *
 * ⚠️ REGLAS IMPORTANTES (respetadas):
 * - ❌ No se modifica ninguna función
 * - ❌ No se cambia lógica ni nombres
 * - ❌ No se eliminan comentarios existentes
 * - ✅ Solo se AGREGA documentación
 * =========================================================
 */

import axios from 'axios';

/**
 * 🌍 URL base del backend OCR
 * ---------------------------------------------------------
 * Se obtiene desde variables de entorno de Vite:
 *
 * - `VITE_API_URL`
 *
 * Si no existe, se usa el fallback:
 * - http://localhost:5001
 *
 * 💡 Esto permite:
 * - Cambiar backend sin tocar código
 * - Usar distintos entornos (dev / qa / prod)
 * ---------------------------------------------------------
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * ⚙️ Instancia de Axios
 * ---------------------------------------------------------
 * Configuración base del cliente HTTP:
 *
 * - `baseURL`: URL raíz del backend
 * - `timeout`: 30s (OCR puede tardar)
 *
 * 🚨 Manejo de errores personalizado:
 * - Si el timeout se excede (30s), se lanza un error descriptivo
 * - El mensaje guía al usuario a verificar calidad de imagen y conexión
 *
 * Beneficios:
 * - Reutilización
 * - Configuración centralizada
 * - Fácil de extender (interceptors, auth, logs)
 * ---------------------------------------------------------
 */
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

/**
 * 🚨 Interceptor de respuestas para manejar errores de timeout
 * ---------------------------------------------------------
 * Este interceptor captura específicamente errores de timeout
 * y los transforma en mensajes más amigables para el usuario.
 *
 * ⚠️ Causas comunes de timeout:
 * 1. 🖼️ Imagen de baja calidad → El OCR tarda más en procesar
 * 2. 🌐 Conexión lenta/inestable → La transferencia de imagen es lenta
 * 3. 🔧 Sobrecarga del servidor → El backend está ocupado
 * ---------------------------------------------------------
 */
api.interceptors.response.use(
  (response) => {
    // ✅ Si la respuesta es exitosa, simplemente la retornamos
    return response;
  },
  (error) => {
    // 🔍 Verificar si es un error de timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('⏰ Timeout detectado:', {
        code: error.code,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });

      // 🚨 Crear un nuevo error con mensaje descriptivo para el usuario
      const timeoutError = new Error(
        '⏰ Timeout excedido (30s). Esto puede deberse a:\n' +
        '1. 🖼️ La imagen no tiene buena calidad (intenta subir una más nítida)\n' +
        '2. 🌐 Conexión lenta o inestable (verifica tu internet)\n' +
        '3. 🔧 El servidor está ocupado (intenta nuevamente en unos momentos)\n\n' +
        '✅ Recomendaciones:\n' +
        '• Usa imágenes bien iluminadas y sin reflejos\n' +
        '• Asegúrate de que todo el texto sea legible\n' +
        '• Verifica tu conexión a internet\n' +
        '• Intenta con una imagen de menor resolución'
      );
      
      // 🏷️ Marcar el error como timeout para manejo específico en UI
      timeoutError.name = 'TimeoutError';
      
      // ❌ Rechazar con el nuevo error descriptivo
      return Promise.reject(timeoutError);
    }

    // 🔄 Para otros tipos de error, simplemente los propagamos
    return Promise.reject(error);
  }
);
/**
 * 🧩 Servicio OCR
 * =========================================================
 * Objeto que agrupa todas las operaciones relacionadas
 * con el OCR de credenciales INE/IFE.
 *
 * Este servicio es consumido por:
 * - App.tsx
 * - Componentes de flujo (wizard)
 *
 * 🔐 Abstracción:
 * - Los componentes solo envían `File`
 * - El servicio decide cómo enviarlo al backend
 * =========================================================
 */
export const ocrService = {
  /**
   * 🪪 Procesar ANVERSO de la credencial (INE/IFE)
   * ---------------------------------------------------------
   * Endpoint backend:
   * - POST /ocr
   *
   * 📥 Entrada:
   * - `file: File` → Imagen de la credencial (frente)
   *
   * 📤 Salida (JSON):
   * - CURP
   * - Clave de elector
   * - Nombre
   * - Domicilio
   * - Vigencia
   * - Indicador `es_ine`
   *
   * 🧠 Uso típico:
   * - Usuario selecciona imagen
   * - Se edita / recorta
   * - Se envía esta versión final al OCR
   * ---------------------------------------------------------
   */
  processAnverso: (file: File) => {
    const formData = new FormData();
    formData.append('imagen', file);

    return api.post('/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * 🔙 Procesar REVERSO de la credencial (MRZ)
   * ---------------------------------------------------------
   * Endpoint backend:
   * - POST /ocrreverso
   *
   * 📥 Entrada:
   * - `file: File` → Imagen del reverso
   *
   * 📤 Salida (JSON):
   * - Líneas MRZ
   * - Nombre(s)
   * - Apellidos
   * - Validación de formato (IDMEX)
   *
   * 🎯 Ideal para:
   * - Verificación de identidad
   * - Matching con otros sistemas
   * ---------------------------------------------------------
   */
  processReverso: (file: File) => {
    const formData = new FormData();
    formData.append('imagen', file);

    return api.post('/ocrreverso', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * ✨ Mejorar imagen antes del OCR (opcional)
   * ---------------------------------------------------------
   * Endpoint backend:
   * - POST /enhance
   *
   * 📥 Entrada:
   * - `file: File` → Imagen original/editada
   *
   * 📤 Salida:
   * - Imagen procesada (PNG/BLOB)
   *
   * ⚙️ responseType:
   * - `blob` → necesario para manejar imágenes binarias
   *
   * 🧠 Flujo típico:
   * - Imagen original
   * - Se envía a IA (backend)
   * - Regresa imagen con mejor contraste/perspectiva
   * - Usuario decide si usarla o no
   * ---------------------------------------------------------
   */
  enhanceImage: (file: File) => {
    const formData = new FormData();
    formData.append('imagen', file);

    return api.post('/enhance', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
  },
};
