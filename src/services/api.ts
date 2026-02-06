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
 * 🔐 Interceptor para agregar token JWT automáticamente
 * ---------------------------------------------------------
 * Este interceptor se ejecuta antes de cada petición y:
 * - Busca token JWT en localStorage
 * - Si existe, lo agrega al header Authorization
 * ---------------------------------------------------------
 */
api.interceptors.request.use(
  (config) => {
    // 🔍 Obtener token del almacenamiento local
    const token = localStorage.getItem('jwt_token');
    
    // 🏷️ Si existe token y el endpoint requiere autenticación, agregarlo
    // ⚠️ NOTA: Solo agregamos token a endpoints protegidos
    // Por ahora solo /ocr requiere token, pero podemos extender
    if (token && config.url?.includes('/ocr')) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token JWT agregado automáticamente a la petición');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
    
    // 🔍 Verificar si es un error 401 (No autorizado)
    if (error.response?.status === 401) {
      console.warn('🔐 Error 401 - Token inválido o expirado');
      
      // 🧹 Limpiar tokens expirados
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('laravel_token');
      localStorage.removeItem('user_data');
      
      // 🔄 Redirigir a login si estamos en la app principal
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      const authError = new Error('🔐 Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      authError.name = 'AuthError';
      return Promise.reject(authError);
    }

    // 🔄 Para otros tipos de error, simplemente los propagamos
    return Promise.reject(error);
  }
);

/**
 * 🔐 Servicio de Autenticación
 * =========================================================
 * Maneja todo lo relacionado con login, logout y gestión de tokens.
 * =========================================================
 */
export const authService = {
  /**
   * 🔑 Login de usuario
   * ---------------------------------------------------------
   * Endpoint backend:
   * - POST /login
   *
   * 📥 Entrada:
   * - username: string
   * - password: string
   *
   * 📤 Salida:
   * - token: JWT generado por nuestro backend
   * - token_laravel: Token original de Laravel
   * - user: Información del usuario
   * - expires_in: Tiempo de expiración en segundos
   *
   * 🗃️ Almacenamiento:
   * - Guarda tokens en localStorage
   * - Guarda información de usuario
   * ---------------------------------------------------------
   */
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/login', {
        username,
        password
      });
      
      const { token, token_laravel, user, expires_in } = response.data;
      
      // 💾 Guardar tokens en localStorage
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('laravel_token', token_laravel);
      localStorage.setItem('user_data', JSON.stringify(user));
      localStorage.setItem('token_expiry', (Date.now() + (expires_in * 1000)).toString());
      
      console.log('✅ Login exitoso, tokens guardados');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      // 🎯 Manejo específico de error 401 (credenciales incorrectas)
      if (error.response?.status === 401) {
        throw new Error('❌ Usuario o contraseña incorrectos');
      }
      
      // 🌐 Manejo de errores de conexión
      if (error.message?.includes('Network Error') || error.code === 'ECONNABORTED') {
        throw new Error('🔌 Error de conexión. Verifica tu internet y que el servidor esté funcionando.');
      }
      
      // 🔄 Error genérico
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  },
  
  /**
   * 🔍 Verificar token JWT
   * ---------------------------------------------------------
   * Endpoint backend:
   * - GET /verify-token
   *
   * 📤 Salida:
   * - user: Información del usuario
   * - token_valid: boolean
   * - remaining_minutes: minutos restantes de sesión
   *
   * 🎯 Uso:
   * - Verificar validez del token al cargar la app
   * - Renovar sesión si es necesario
   * ---------------------------------------------------------
   */
  verifyToken: async () => {
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      throw new Error('🔐 No hay token disponible');
    }
    
    try {
      const response = await api.get('/verify-token', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Error verificando token:', error);
      
      // 🧹 Limpiar tokens inválidos
      if (error.response?.status === 401) {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('laravel_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('token_expiry');
      }
      
      throw error;
    }
  },
  
  /**
   * 🚪 Logout
   * ---------------------------------------------------------
   * Limpia todos los tokens y datos de usuario.
   * ---------------------------------------------------------
   */
  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('laravel_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('token_expiry');
    console.log('🚪 Sesión cerrada correctamente');
  },
  
  /**
   * 👤 Obtener información del usuario actual
   * ---------------------------------------------------------
   * Lee datos del usuario desde localStorage.
   * ---------------------------------------------------------
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user_data');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  /**
   * ⏰ Verificar si la sesión está activa
   * ---------------------------------------------------------
   * Verifica:
   * 1. Que exista token JWT
   * 2. Que no haya expirado (100 minutos)
   * ---------------------------------------------------------
   */
  isSessionActive: () => {
    const token = localStorage.getItem('jwt_token');
    const expiry = localStorage.getItem('token_expiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    const expiryTime = parseInt(expiry);
    const currentTime = Date.now();
    
    // ✅ Verificar que el token no haya expirado (con margen de 1 minuto)
    return currentTime < (expiryTime - 60000); // 1 minuto antes de expirar
  },
  
  /**
   * 🏷️ Obtener token JWT
   * ---------------------------------------------------------
   * Retorna el token JWT actual.
   * ---------------------------------------------------------
   */
  getToken: () => {
    return localStorage.getItem('jwt_token');
  },
  
  /**
   * 🏷️ Obtener token Laravel
   * ---------------------------------------------------------
   * Retorna el token Laravel actual.
   * ---------------------------------------------------------
   */
  getLaravelToken: () => {
    return localStorage.getItem('laravel_token');
  }
};

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
   * 🔐 Requiere:
   * - Token JWT válido en header Authorization
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