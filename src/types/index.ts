/**
 * 📋 Tipos de datos para la aplicación
 * =========================================================
 * Este archivo define los contratos (interfaces) que utiliza
 * el frontend para:
 * - ✅ Tipar la respuesta del OCR (anverso y reverso)
 * - 🖼️ Tipar los ajustes de imagen (si existen en el editor)
 * - ✂️ Tipar el recorte (crop) para edición y preprocesamiento
 *
 * 🎯 Objetivos:
 * - Evitar errores en runtime (TypeScript 🛡️)
 * - Hacer el código auto-documentado
 * - Facilitar mantenimiento y escalabilidad
 * =========================================================
 */

/**
 * 🪪 INEData
 * ---------------------------------------------------------
 * Representa los datos extraídos del **ANVERSO** de la INE/IFE.
 *
 * 💡 Normalmente proviene del endpoint:
 * - `POST /ocr`
 *
 * 🧠 Nota:
 * - Los campos dependen de la calidad del OCR y del formato de la credencial.
 * - En algunos casos el backend puede devolver strings vacíos si no detecta
 *   el texto con suficiente claridad.
 * ---------------------------------------------------------
 */
/**
 * 🪪 INEData
 * ---------------------------------------------------------
 * Representa los datos extraídos del **ANVERSO** de la INE/IFE.
 *
 * 💡 Normalmente proviene del endpoint:
 * - `POST /ocr`
 *
 * 🧠 Nota:
 * - Los campos dependen de la calidad del OCR y del formato de la credencial.
 * - En algunos casos el backend puede devolver strings vacíos si no detecta
 *   el texto con suficiente claridad.
 * ---------------------------------------------------------
 */
export interface INEData {
  /**
   * ✅ Indicador rápido de validación
   * - `true` si el backend detecta que la imagen corresponde a INE/IFE
   * - `false` si no parece una credencial válida o no se encontró el header esperado
   */
  es_ine: boolean;

  /**
   * 🧑 Nombre completo detectado
   * - Ej: "CASTILLO OLIVERA RICARDO ORLANDO"
   * - Formato puede variar dependiendo del OCR
   */
  nombre: string;

  /**
   * 🆔 CURP detectada (18 caracteres típicamente)
   * Ej: ABCD010203HDFXXX09
   */
  curp: string;

  /**
   * 🔑 Clave de elector
   * - Identificador electoral (normalmente 18 caracteres)
   */
  clave_elector: string;

  /**
   * 🎂 Fecha de nacimiento
   * - Formato depende del OCR/backend (ej. "01/02/1990" o "1990")
   */
  fecha_nacimiento: string;

  /**
   * 📅 Año de registro en el padrón
   * - Normalmente un año "YYYY"
   */
  anio_registro: string;

  /**
   * 🧩 Sección electoral
   * - Número de sección (ej. "1234")
   */
  seccion: string;

  /**
   * ⏳ Vigencia de la credencial
   * - Puede ser un año o rango (ej. "2024", "2024-2034")
   * - Se usa para validar si está vigente
   */
  vigencia: string;

  /**
   * 🚻 Sexo detectado
   * - Normalmente "H" / "M" o "HOMBRE" / "MUJER"
   */
  sexo: string;

  /**
   * 🌎 País (cuando aplica)
   * - Puede venir fijo o inferido dependiendo del texto detectado
   */
  pais: string;

  /**
   * 🛣️ Calle del domicilio
   */
  calle: string;

  /**
   * 🏘️ Colonia / fraccionamiento
   */
  colonia: string;

  /**
   * 🗺️ Estado (ej. "QUINTANA ROO")
   */
  estado: string;

  /**
   * 🔢 Número exterior/interior (si el OCR lo detecta)
   */
  numero: string;

  /**
   * 📮 Código Postal (CP)
   */
  codigo_postal: string;
}

/**
 * 🔙 ReversoData
 * ---------------------------------------------------------
 * Representa datos extraídos del **REVERSO** (zona MRZ).
 *
 * 💡 Normalmente proviene del endpoint:
 * - `POST /ocrreverso`
 *
 * 🧠 Particularidad:
 * - El reverso suele contener 2 o 3 líneas tipo MRZ.
 * - El backend valida patrones como "IDMEX".
 * ---------------------------------------------------------
 */
export interface ReversoData {
  /**
   * 🧾 Línea MRZ 1 detectada
   * - Puede contener "IDMEX..." y datos codificados
   */
  linea1: string;

  /**
   * 🧾 Línea MRZ 2 detectada
   */
  linea2: string;

  /**
   * 👨‍👩‍👧 Apellido paterno extraído del MRZ
   */
  apellido_paterno: string;

  /**
   * 👨‍👩‍👧 Apellido materno extraído del MRZ
   */
  apellido_materno: string;

  /**
   * 👤 Nombre(s) extraídos del MRZ
   */
  nombre_reverso: string;

  /**
   * ✅ Indicador de validación del reverso
   * - `true` si el backend considera que corresponde a INE/IFE válida (por patrón MRZ)
   * - `false` si no cumple formato esperado
   */
  es_ine: boolean;
}

/**
 * 🎛️ ImageAdjustments
 * ---------------------------------------------------------
 * Representa ajustes visuales aplicables a una imagen.
 *
 * 🎯 Uso típico:
 * - Preprocesamiento antes de OCR (mejorar legibilidad)
 * - Ajustes manuales tipo editor (si se implementa)
 *
 * 🧠 Nota:
 * - Aunque el wizard principal usa crop/rotate,
 *   esta interfaz sirve para extender un editor más avanzado.
 * ---------------------------------------------------------
 */
export interface ImageAdjustments {
  /** ☀️ Brillo (brightness) */
  brightness: number;

  /** 🌓 Contraste (contrast) */
  contrast: number;

  /** 🌈 Saturación (saturation) */
  saturation: number;

  /** 🌫️ Desenfoque (blur) */
  blur: number;

  /** 🔪 Nitidez (sharpen) */
  sharpen: number;

  /** 🔄 Rotación en grados (rotate) */
  rotate: number;

  /** 🔍 Escala / zoom (scale) */
  scale: number;
}

/**
 * ✂️ Crop
 * ---------------------------------------------------------
 * Define un recorte (crop) rectangular.
 *
 * 🎯 Uso típico:
 * - Recortar la región exacta de la credencial
 * - Reducir ruido visual (fondo, manos, mesa, etc.)
 * - Mejorar precisión del OCR
 *
 * 🧠 Campo `unit`:
 * - `'px'`: valores absolutos en pixeles
 * - `'%'`: valores relativos al tamaño de la imagen
 * ---------------------------------------------------------
 */
export interface Crop {
  /** 📍 Coordenada X inicial del recorte */
  x: number;

  /** 📍 Coordenada Y inicial del recorte */
  y: number;

  /** 📏 Ancho del recorte */
  width: number;

  /** 📐 Alto del recorte */
  height: number;

  /** 📐 Unidad del recorte */
  unit: 'px' | '%';
}
