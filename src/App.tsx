/**
 * 🪪 App.tsx
 * =========================================================
 * 🎯 Componente raíz de la aplicación (Root Component)
 *
 * Este archivo orquesta TODO el flujo del frontend para OCR de INE/IFE:
 * 1) 🔐 Verificación de autenticación
 * 2) 📸 Capturar / subir imagen
 * 3) ✂️ Editar (crop/rotate/historial)
 * 4) 👁️ Previsualizar (original/editada/mejorada)
 * 5) 🔍 Procesar OCR (anverso o reverso)
 *
 * 🧠 Arquitectura:
 * - Este componente actúa como "orquestador" (coordinador de estados)
 * - Los componentes hijos se enfocan solo en UI/UX y callbacks
 *
 * 🔌 Integración con Backend:
 * - ocrService.processAnverso(file)  -> POST /ocr
 * - ocrService.processReverso(file)  -> POST /ocrreverso
 * - ocrService.enhanceImage(file)    -> POST /enhance (blob/png)
 *
 * 🔐 Autenticación:
 * - Usa authService para gestión de tokens JWT
 * - Muestra información del usuario en navbar
 * - Botón para cerrar sesión
 *
 * ✅ Reglas solicitadas (cumplidas):
 * - ❌ NO se cambia lógica, funciones, nombres ni estructura
 * - ❌ NO se eliminan comentarios existentes (incluyendo bloques comentados)
 * - ✅ SOLO se agrega documentación AngularDoc/JSDoc + emojis 😄
 * =========================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Edit,
  Preview,
  Assignment,
  Info,
  Logout as LogoutIcon  // 🆕 Icono para logout
} from '@mui/icons-material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 📦 Componentes
import ImageUploader from './components/ImageUploader';
import CameraCapture from './components/CameraCapture';
import ImageEditor from './components/ImageEditor';
import PreviewPanel from './components/PreviewPanel';
import OCRResults from './components/OCRResults';

// 🌐 Servicios
import { ocrService, authService } from './services/api';

// 📋 Pasos del proceso
/**
 * 🧭 steps
 * ---------------------------------------------------------
 * Lista de etiquetas para el Stepper (wizard).
 * Se renderiza como "pasos" en la UI y define el camino del usuario.
 *
 * ✅ Importante:
 * - El Stepper usa `activeStep` para resaltar el paso actual.
 * - El contenido de cada paso se controla por `renderStepContent(step)`.
 * ---------------------------------------------------------
 */
const steps = [
  '📸 Capturar Imagen',
  '✂️ Editar Imagen',
  '👁️ Previsualizar',
  '🔍 Procesar OCR'
];

// 📐 Importar tipo PixelCrop desde react-image-crop
/**
 * 🧩 PixelCrop
 * ---------------------------------------------------------
 * Tipo usado para representar un recorte en pixeles (x, y, width, height).
 * En este componente se importa porque el editor puede producir recortes.
 *
 * ⚠️ Nota:
 * - Aquí solo se importa el tipo; el recorte real se gestiona en ImageEditor.
 * ---------------------------------------------------------
 */


/**
 * 🧠 App
 * =========================================================
 * Componente principal que:
 * - Administra estados globales (imagen, paso actual, OCR, modo reverso)
 * - Coordina navegación entre pasos
 * - Ejecuta llamadas al backend (OCR y mejora)
 * - Renderiza barra superior, drawer lateral, stepper y contenido
 * - Gestiona autenticación y sesión del usuario
 * =========================================================
 */
const App: React.FC = () => {
  // 🎨 Hook de tema y media queries para responsividad
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // 🚀 Estados principales
  /**
   * 🧭 activeStep
   * - Controla qué vista del wizard se muestra (0..3)
   */
  const [activeStep, setActiveStep] = useState(0);

  /**
   * 🖼️ imageSrc
   * - Imagen "actual" seleccionada para trabajar y/o enviar al OCR.
   * - Puede ser: original, editada o mejorada.
   * - Se guarda como DataURL: "data:image/..."
   */
  const [imageSrc, setImageSrc] = useState<string>(''); // Imagen actual (puede estar editada)

  /**
   * 🧾 originalImage
   * - Copia inmutable (idealmente) de la imagen original.
   * - Se usa para "reset" total.
   */
  const [originalImage, setOriginalImage] = useState<string>(''); // Imagen original sin editar

  /**
   * ✂️ editedImage
   * - Versión más reciente de la imagen editada en el editor.
   * - Se actualiza cuando ImageEditor dispara `onImageChange`.
   */
  const [editedImage, setEditedImage] = useState<string>(''); // Imagen editada actualmente

  /**
   * ✨ enhancedImage
   * - Imagen mejorada por el backend (/enhance).
   * - El usuario puede elegir usarla o no (PreviewPanel).
   */
  const [enhancedImage, setEnhancedImage] = useState<string>(''); // Imagen mejorada por IA

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  /**
   * 📦 ocrData
   * - Resultado del OCR (JSON) devuelto por el backend.
   * - Puede contener estructura de anverso o reverso.
   *
   * ⚠️ Se usa `any` (temporalmente) por flexibilidad.
   * 💡 Ideal futuro:
   * - Tipar esto con `INEData | ReversoData` para máxima seguridad.
   */
  const [ocrData, setOcrData] = useState<any>(null);

  /**
   * 🔙 isReverso
   * - Selector de modo:
   *   - false -> Anverso (POST /ocr)
   *   - true  -> Reverso (POST /ocrreverso)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isReverso, _setIsReverso] = useState(false); // 🔧 Cambio: agregar prefijo _ para indicar que no se usa

  // ⚙️ Estados de proceso
  /**
   * ⏳ loading
   * - Indica proceso en curso de OCR (botón y UI de resultados).
   */
  const [loading, setLoading] = useState(false);

  /**
   * ⚡ enhancing
   * - Indica proceso en curso de mejora de imagen (backend /enhance).
   */
  const [enhancing, setEnhancing] = useState(false);

  /**
   * 📷 cameraOpen
   * - Controla la apertura/cierre del modal de cámara (CameraCapture).
   */
  const [cameraOpen, setCameraOpen] = useState(false);

  /**
   * 🧾 drawerOpen
   * - Controla la apertura/cierre del menú lateral (Drawer).
   */
  const [drawerOpen, setDrawerOpen] = useState(false);

  /**
   * 🧼 isImageLoading
   * - Estado UI para cuando se está leyendo/transformando la imagen
   *   (FileReader -> DataURL).
   */
  const [isImageLoading, setIsImageLoading] = useState(false);

  /**
   * 👤 user
   * - Información del usuario autenticado.
   * - Se carga desde localStorage al iniciar el componente.
   */
  const [user, setUser] = useState<any>(null);


  // 🔍 Cargar información del usuario al inicio
  /**
   * 👤 useEffect (cargar usuario)
   * ---------------------------------------------------------
   * Al montar el componente:
   * - Obtiene información del usuario desde localStorage
   * - Actualiza el estado `user`
   * - Log para debugging
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    console.log('👤 Usuario cargado en App.tsx:', currentUser);
  }, []);

  // 🔍 Debug: Ver estado actual
  /**
   * 🧪 useEffect (debug)
   * ---------------------------------------------------------
   * Loggea estado global en cada cambio importante:
   * - Paso actual
   * - Longitudes de dataURL (para validar que se cargó la imagen)
   * - Comparaciones para saber qué versión está activa (original/editada/mejorada)
   *
   * ✅ En desarrollo, esto ayuda muchísimo para rastrear bugs de UI.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    console.log('🔍 Estado App.tsx:', {
      activeStep,
      imageSrcLength: imageSrc?.length || 0,
      originalImageLength: originalImage?.length || 0,
      editedImageLength: editedImage?.length || 0,
      enhancedImageLength: enhancedImage?.length || 0,
      isImageSrcOriginal: imageSrc === originalImage,
      isImageSrcEdited: imageSrc === editedImage,
      isImageSrcEnhanced: imageSrc === enhancedImage,
      isMobile,
      isTablet,
      user: user?.username || 'No autenticado'
    });
  }, [activeStep, imageSrc, originalImage, editedImage, enhancedImage, isMobile, isTablet, user]);

  // 🚪 Función para logout
  /**
   * 🚪 handleLogout
   * ---------------------------------------------------------
   * Cierra la sesión del usuario:
   * 1. Limpia tokens de localStorage
   * 2. Muestra toast de confirmación
   * 3. Redirige a /login después de 1 segundo
   *
   * 🎯 UX: Delay para que el usuario vea el mensaje de confirmación
   * ---------------------------------------------------------
   */
  const handleLogout = () => {
    console.log('🚪 Cerrando sesión...');

    // 🧹 Limpiar tokens
    authService.logout();

    // ✅ Toast de confirmación
    toast.success('👋 Sesión cerrada correctamente');

    // 🔄 Redirigir a login después de un breve delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  // 📁 Manejar selección de imagen
  /**
   * 📁 handleImageSelect
   * ---------------------------------------------------------
   * Recibe un `File` (desde ImageUploader) y lo convierte a DataURL.
   *
   * ✅ Validaciones:
   * - Debe existir file
   * - Debe ser tipo image/*
   *
   * 🔁 Flujo:
   * - Activa `isImageLoading`
   * - FileReader.readAsDataURL(file)
   * - En `onload`:
   *   - setImageSrc / setOriginalImage / setEditedImage
   *   - reset enhancedImage
   *   - pasa al paso 1 (edición)
   *
   * 🎯 Resultado:
   * - El usuario entra directo a editar la imagen cargada.
   * ---------------------------------------------------------
   */
  const handleImageSelect = (file: File) => {
    console.log('📁 Archivo seleccionado en App.tsx:', {
      nombre: file.name,
      tamaño: file.size,
      tipo: file.type
    });

    if (!file) {
      toast.error('❌ No se seleccionó ningún archivo');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('❌ El archivo no es una imagen válida');
      return;
    }

    setIsImageLoading(true);

    const reader = new FileReader();

    reader.onloadstart = () => {
      console.log('⏳ Iniciando conversión a base64...');
    };

    /**
     * ✅ onload
     * - `result` debe ser DataURL válido: data:image/...
     * - Si falla, se notifica y se detiene.
     */
    reader.onload = (e) => {
      const result = e.target?.result as string;

      console.log('✅ Conversión completada:', {
        esString: typeof result === 'string',
        longitud: result?.length || 0,
        esDataUrl: result?.startsWith('data:'),
        primerosChars: result?.substring(0, 30)
      });

      if (!result || !result.startsWith('data:image')) {
        toast.error('❌ Error: La imagen no se convirtió correctamente');
        setIsImageLoading(false);
        return;
      }

      // 🎉 Establecer todas las versiones de la imagen
      setImageSrc(result);
      setOriginalImage(result);
      setEditedImage(result); // Inicialmente es igual a la original
      setEnhancedImage(''); // Resetear imagen mejorada
      setIsImageLoading(false);
      setActiveStep(1);

      console.log('🎯 Paso cambiado a 1 - Imagen lista para edición');
      toast.success('✅ Imagen cargada correctamente');
    };

    /**
     * ❌ onerror
     * - Manejo de errores de FileReader
     */
    reader.onerror = (error) => {
      console.error('❌ Error en FileReader:', error);
      toast.error('❌ Error al cargar la imagen');
      setIsImageLoading(false);
    };

    /**
     * ⚠️ onabort
     * - El usuario puede cancelar la lectura (casos raros, pero existen)
     */
    reader.onabort = () => {
      console.warn('⚠️ Lectura cancelada por el usuario');
      toast.warning('⚠️ Lectura de imagen cancelada');
      setIsImageLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // 📸 Manejar captura de cámara
  /**
   * 📸 handleCameraCapture
   * ---------------------------------------------------------
   * Recibe una imagen capturada desde CameraCapture como DataURL.
   *
   * ✅ Validación:
   * - Debe iniciar con "data:image"
   *
   * 🎯 Resultado:
   * - Se asigna como original + editada + actual
   * - Se resetea la mejorada
   * - Se avanza al paso 1 (edición)
   * ---------------------------------------------------------
   */
  const handleCameraCapture = (capturedImageSrc: string) => {
    console.log('📸 Imagen capturada desde cámara:', {
      longitud: capturedImageSrc?.length || 0,
      esDataUrl: capturedImageSrc?.startsWith('data:image')
    });

    if (!capturedImageSrc || !capturedImageSrc.startsWith('data:image')) {
      toast.error('❌ La foto capturada no es válida');
      return;
    }

    setImageSrc(capturedImageSrc);
    setOriginalImage(capturedImageSrc);
    setEditedImage(capturedImageSrc);
    setEnhancedImage('');
    setIsImageLoading(false);
    setActiveStep(1);
    toast.success('📸 Foto capturada correctamente');
  };

  // ✂️ Manejar cambios en la edición de imagen
  /**
   * ✂️ handleImageEdit
   * ---------------------------------------------------------
   * Callback para recibir la imagen editada desde ImageEditor.
   *
   * ✅ Validación:
   * - Debe ser DataURL "data:image"
   *
   * 🔁 Efecto:
   * - Actualiza:
   *   - imageSrc (la imagen "actual" que se usa en preview y OCR)
   *   - editedImage (para que PreviewPanel pueda alternar)
   * ---------------------------------------------------------
   */
  const handleImageEdit = (editedImageSrc: string) => {
    console.log('✂️ Imagen editada recibida en App.tsx:', {
      longitud: editedImageSrc?.length || 0,
      esDataUrl: editedImageSrc?.startsWith('data:image'),
      diferenteDeOriginal: editedImageSrc !== originalImage
    });

    if (!editedImageSrc || !editedImageSrc.startsWith('data:image')) {
      console.error('❌ La imagen editada no es válida');
      return;
    }

    // Actualizar tanto imageSrc como editedImage
    setImageSrc(editedImageSrc);
    setEditedImage(editedImageSrc);
    console.log('✅ Imagen editada actualizada en estado global');
  };

  // 🖼️ Manejar selección de imagen en PreviewPanel
  /**
   * 🖼️ handleSelectImage
   * ---------------------------------------------------------
   * Permite seleccionar cuál versión de la imagen usar:
   * - original
   * - edited
   * - enhanced
   *
   * 📌 Uso:
   * - Lo llama PreviewPanel con botones "Usar Original/Editada/Mejorada"
   *
   * 🎯 Resultado:
   * - Cambia `imageSrc` a la versión seleccionada
   * - Eso impacta directamente lo que se enviará al OCR
   * ---------------------------------------------------------
   */
  const handleSelectImage = (imageType: 'original' | 'edited' | 'enhanced') => {
    console.log('🖼️ Seleccionando imagen:', imageType);

    let selectedImage = '';

    switch (imageType) {
      case 'original':
        selectedImage = originalImage;
        toast.info('🔄 Usando imagen original');
        break;
      case 'edited':
        selectedImage = editedImage;
        toast.info('✂️ Usando imagen editada');
        break;
      case 'enhanced':
        if (enhancedImage) {
          selectedImage = enhancedImage;
          toast.info('✨ Usando imagen mejorada por IA');
        }
        break;
    }

    if (selectedImage) {
      setImageSrc(selectedImage);
      console.log('✅ Imagen seleccionada:', imageType, 'longitud:', selectedImage.length);
    }
  };

  // ⚡ Mejorar imagen
  /**
   * ⚡ handleEnhanceImage
   * ---------------------------------------------------------
   * Envía la imagen actual (imageSrc) al backend para mejora.
   *
   * 🔁 Conversión:
   * - imageSrc (DataURL) -> fetch -> Blob -> File
   * - Ese File se envía a ocrService.enhanceImage(file)
   *
   * 📥 Respuesta:
   * - Viene como `blob` (PNG)
   * - Se convierte a DataURL con FileReader
   *
   * 🎯 Resultado:
   * - setEnhancedImage(dataURL)
   * - El usuario puede seleccionarla desde PreviewPanel
   * ---------------------------------------------------------
   */
  const handleEnhanceImage = async () => {
    if (!imageSrc) {
      toast.error('❌ No hay imagen para mejorar');
      return;
    }

    setEnhancing(true);
    console.log('⚡ Iniciando mejora de imagen...');

    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

      const result = await ocrService.enhanceImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const enhanced = e.target?.result as string;
        if (enhanced && enhanced.startsWith('data:image')) {
          setEnhancedImage(enhanced);
          toast.success('✨ Imagen mejorada con éxito');
        } else {
          toast.error('❌ La imagen mejorada no es válida');
        }
      };
      reader.readAsDataURL(result.data);
    } catch (error) {
      console.error('❌ Error al mejorar la imagen:', error);
      toast.error('❌ Error al mejorar la imagen');
    } finally {
      setEnhancing(false);
    }
  };

  // 🔍 Procesar OCR
  /**
   * 🔍 handleProcessOCR
   * ---------------------------------------------------------
   * Envía la imagen actual (imageSrc) al backend OCR.
   *
   * 🔁 Conversión:
   * - imageSrc (DataURL) -> fetch -> Blob -> File
   *
   * 🚦 Selector de endpoint:
   * - Si `isReverso`:
   *   - ocrService.processReverso
   * - Si NO:
   *   - ocrService.processAnverso
   *
   * ✅ Resultado:
   * - setOcrData(JSON)
   * - setActiveStep(3) para mostrar resultados
   * ---------------------------------------------------------
   */
  const handleProcessOCR = async () => {
    if (!imageSrc) {
      toast.error('❌ No hay imagen para procesar');
      return;
    }

    setLoading(true);
    console.log('🔍 Iniciando procesamiento OCR...');

    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'ine.jpg', { type: 'image/jpeg' });

      const endpoint = isReverso ? ocrService.processReverso : ocrService.processAnverso;
      const result = await endpoint(file);

      console.log('✅ OCR completado:', result.data);
      setOcrData(result.data);
      setActiveStep(3);
      toast.success('✅ OCR procesado correctamente');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error en OCR:', error);

      if (error.name === 'TimeoutError') {
        // 🕒 Error específico de timeout (ya viene formateado del interceptor)
        toast.error(`❌ ${error.message}`);
      } else {
        // 🔧 Otros tipos de error
        toast.error(`❌ Error en OCR: ${error.message || 'Error desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Cambiar paso
  /**
   * ➡️ handleNext
   * ---------------------------------------------------------
   * Navegación hacia adelante del wizard.
   *
   * Reglas:
   * - Si estás en paso 1 (editar):
   *   - Verifica que haya imagen válida
   *   - Avanza a paso 2 (preview)
   *
   * - Si estás en paso 2 (preview):
   *   - Lanza directamente el OCR
   *
   * 🧠 Nota:
   * - El botón "Siguiente" solo aparece cuando `activeStep < 2`,
   *   y en paso 2 se muestra directamente "Procesar OCR".
   * ---------------------------------------------------------
   */
  const handleNext = () => {
    console.log('➡️ Siguiente paso solicitado, paso actual:', activeStep);

    if (activeStep === 1) {
      if (imageSrc && imageSrc.startsWith('data:image')) {
        setActiveStep(2);
        toast.info('👁️ Avanzando a previsualización');
      } else {
        toast.error('❌ No hay una imagen válida para continuar');
      }
    }

    if (activeStep === 2) {
      handleProcessOCR();
    }
  };

  /**
   * 🔄 handleResetToOriginal
   * ---------------------------------------------------------
   * Restablece el estado de imagen a la versión original.
   *
   * ✅ Resetea:
   * - imageSrc     -> originalImage
   * - editedImage  -> originalImage
   * - enhancedImage -> ''
   *
   * 🎯 Útil para:
   * - Si el usuario recortó mal
   * - Si aplicó rotación incorrecta
   * - Si quiere "volver a empezar" sin reiniciar toda la app
   * ---------------------------------------------------------
   */
  const handleResetToOriginal = () => {
    console.log('🔄 Restableciendo a imagen original desde App.tsx');

    if (originalImage) {
      setImageSrc(originalImage);
      setEditedImage(originalImage);
      setEnhancedImage('');
      toast.success('🔄 Imagen restablecida a la versión original');

      console.log('✅ Imagen restablecida:', {
        originalLength: originalImage.length,
        imageSrcLength: imageSrc.length
      });
    } else {
      toast.error('❌ No hay imagen original disponible');
    }
  };

  /**
   * ↩️ handleBack
   * ---------------------------------------------------------
   * Navegación hacia atrás en el wizard.
   * Simplemente reduce `activeStep` en 1.
   */
  const handleBack = () => {
    console.log('⬅️ Paso anterior solicitado');
    setActiveStep((prev) => prev - 1);
  };

  /**
   * 🏠 handleReset
   * ---------------------------------------------------------
   * Reinicia toda la aplicación al estado inicial (paso 0).
   *
   * ✅ Limpia:
   * - Paso activo
   * - Imágenes (original/editada/mejorada/actual)
   * - Datos OCR
   * - Estados de loading
   * ---------------------------------------------------------
   */
  const handleReset = () => {
    console.log('🔄 Reiniciando aplicación...');
    setActiveStep(0);
    setImageSrc('');
    setOriginalImage('');
    setEditedImage('');
    setEnhancedImage('');
    setOcrData(null);
    setIsImageLoading(false);
    toast.info('🔄 Aplicación reiniciada');
  };

  // 🎯 Renderizar paso actual
  /**
   * 🎨 renderStepContent
   * ---------------------------------------------------------
   * Renderiza el componente adecuado según el paso del wizard:
   *
   * Paso 0: ImageUploader
   * - Seleccionar imagen desde archivo o abrir cámara
   *
   * Paso 1: ImageEditor
   * - Editar imagen (crop/rotate/historial)
   * - Incluye estados de "cargando imagen" y validación
   *
   * Paso 2: PreviewPanel
   * - Permite escoger entre original/editada/mejorada
   * - También tiene el hook `onEnhance` para mejora
   *
   * Paso 3: OCRResults
   * - Muestra el resultado del OCR y comparación de imagen
   * ---------------------------------------------------------
   */
  const renderStepContent = (step: number) => {
    console.log('🎨 Renderizando paso:', step, {
      tieneImagen: !!imageSrc,
      imagenValida: imageSrc?.startsWith('data:image'),
      isLoading: isImageLoading,
      isMobile,
      isTablet
    });

    switch (step) {
      case 0:
        return (
          <ImageUploader
            onImageSelect={handleImageSelect}
            onCameraOpen={() => setCameraOpen(true)}
          // 🔧 Cambio: Eliminar la prop isMobile que no existe en ImageUploaderProps
          />
        );

      case 1:
        /**
         * ⏳ Estado: Imagen cargando
         * - Se muestra mientras FileReader termina.
         */
        if (isImageLoading) {
          return (
            <Paper elevation={3} sx={{
              p: isMobile ? 2 : 4,
              textAlign: 'center',
              borderRadius: 2,
              mx: isMobile ? 0 : 'auto'
            }}>
              <CircularProgress size={isMobile ? 40 : 60} sx={{ mb: isMobile ? 2 : 3 }} />
              <Typography variant={isMobile ? "h6" : "h6"} gutterBottom>
                ⏳ Cargando Imagen...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Convirtiendo imagen para edición
              </Typography>
            </Paper>
          );
        }

        /**
         * ⚠️ Estado: Imagen inválida/no disponible
         * - Protege el editor para que no se rompa si `imageSrc` no es DataURL.
         */
        if (!imageSrc || !imageSrc.startsWith('data:image')) {
          return (
            <Paper
              elevation={3}
              sx={{
                p: isMobile ? 2 : 4,
                textAlign: 'center',
                borderRadius: 2,
                backgroundColor: 'warning.light',
                mx: isMobile ? 0 : 'auto'
              }}
            >
              <Typography variant={isMobile ? "h6" : "h6"} gutterBottom color="warning.main">
                ⚠️ Imagen no disponible
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"} paragraph>
                La imagen no se cargó correctamente. Por favor, regresa al paso anterior.
              </Typography>
              <Button variant="contained" color="primary" onClick={handleBack} size={isMobile ? "small" : "medium"}>
                ↩️ Regresar
              </Button>
            </Paper>
          );
        }

        /**
         * ✂️ Editor
         * - Recibe imageSrc (actual)
         * - Emite onImageChange con la imagen editada (DataURL)
         * - Permite reset a original llamando a handleResetToOriginal
         *
         * ⚠️ onCropComplete:
         * - Actualmente está como no-op `() => {}`
         * - Se deja así para no cambiar comportamiento.
         */
        return (
          <ImageEditor
            imageSrc={imageSrc}
            onImageChange={handleImageEdit}
            onCropComplete={() => { }}
            onResetToOriginal={handleResetToOriginal}
          // 🔧 Cambio: Eliminar la prop isMobile que no existe en ImageEditorProps
          />
        );

      case 2:
        /**
         * 👁️ PreviewPanel
         * - Muestra y permite seleccionar la "imagen activa"
         * - Se usa `imageSrc` como currentImage
         * - Puede mostrar `enhancedImage` si existe
         */
        return (
          <PreviewPanel
            originalImage={originalImage}
            editedImage={editedImage}
            enhancedImage={enhancedImage}
            currentImage={imageSrc}
            isProcessing={enhancing}
            onUseOriginal={() => handleSelectImage('original')}
            onUseEdited={() => handleSelectImage('edited')}
            onUseEnhanced={() => handleSelectImage('enhanced')}
            onEnhance={handleEnhanceImage}
          // 🔧 Cambio: Eliminar la prop isMobile que no existe en PreviewPanelProps
          />
        );

      case 3:
        /**
         * ✅ OCRResults
         * - Recibe data (ocrData)
         * - Recibe loading y modo reverso
         * - Se le pasa la imagen actual como procesada (para comparación)
         */
        return (
          <OCRResults
            data={ocrData}
            isReverso={isReverso}
            loading={loading}
            processedImage={imageSrc} // 🖼️ Pasar la imagen actual como procesada
            imageComparison={{
              originalImage: originalImage, // Imagen original sin editar
              processedImage: imageSrc, // Imagen que se procesó (puede estar editada)
              // confidence: ocrData?.confidence // Si tu API devuelve confianza
            }}
          // 🔧 Cambio: Eliminar la prop isMobile que no existe en OCRResultsProps
          />
        );

      default:
        return null;
    }
  };

  /**
   * 🧩 Render principal
   * =========================================================
   * Layout general con mejoras responsivas:
   * - 📱 Optimizado para móviles
   * - 🖥️ Se adapta a desktop
   * - 👤 Muestra información del usuario
   * - 🚪 Botón para cerrar sesión
   * =========================================================
   */
  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      // 📱 Ajustes para móviles
      '@media (max-width: 768px)': {
        flexDirection: 'column'
      }
    }}>
      {/* 📱 Barra de navegación responsiva */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          // 📱 Ajuste de altura en móviles
          '@media (max-width: 768px)': {
            height: 56
          }
        }}
      >
        <Toolbar sx={{
          minHeight: { xs: 56, sm: 64 },
          // 📱 Padding reducido en móviles
          paddingLeft: { xs: 1, sm: 2 },
          paddingRight: { xs: 1, sm: 2 }
        }}>
          {/* 🍔 Botón menú lateral */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{
              mr: 2,
              display: { xs: 'flex', sm: 'flex' }
            }}
            size={isMobile ? "small" : "medium"}
          >
            <MenuIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>

          {/* 🪪 Título app responsivo */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {isMobile ? '🪪 INE Scanner' : '🪪 INE Scanner'}
          </Typography>

          {/* 👤 Info usuario (solo en desktop) */}
          {user && !isMobile && (
            <Typography
              variant="caption"
              sx={{
                mr: 2,
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.2)',
                px: 1,
                py: 0.5,
                borderRadius: 1
              }}
            >
              👤 {user.nombre || user.username}
            </Typography>
          )}

          {/* 🎛️ Contenedor de botones de acción */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* 🏠 Botón de reinicio responsivo */}
            <Button
              color="inherit"
              onClick={handleReset}
              startIcon={!isMobile && <Home />}
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                padding: { xs: '4px 8px', sm: '6px 16px' },
                minWidth: { xs: 'auto', sm: 'auto' }
              }}
              size={isMobile ? "small" : "medium"}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Reiniciar
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                🏠
              </Box>
            </Button>

            {/* 🚪 Botón de cerrar sesión responsivo */}
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={!isMobile && <LogoutIcon />}
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                padding: { xs: '4px 8px', sm: '6px 16px' },
                minWidth: { xs: 'auto', sm: 'auto' },
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }
              }}
              size={isMobile ? "small" : "medium"}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Cerrar Sesión
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                🚪
              </Box>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 📋 Menú lateral responsivo */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: { xs: 240, sm: 280 },
          // 📱 Ocupa toda la pantalla en móviles
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 280 },
            boxSizing: 'border-box',
            maxWidth: { xs: '300px', sm: '280px' }
          }
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <List>
          {/* 🏠 Ir a inicio (paso 0) */}
          <ListItem
            button
            onClick={() => {
              setActiveStep(0);
              setDrawerOpen(false);
            }}
            selected={activeStep === 0}
            sx={{ py: isMobile ? 1 : 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
              <Home fontSize={isMobile ? "small" : "medium"} />
            </ListItemIcon>
            <ListItemText
              primary="Inicio"
              primaryTypographyProps={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            />
          </ListItem>

      

          {/* ✂️ Ir a editar (si ya hay paso > 0) */}
          <ListItem
            button
            onClick={() => {
              if (activeStep > 0) {
                setActiveStep(1);
                setDrawerOpen(false);
              }
            }}
            selected={activeStep === 1}
            disabled={activeStep === 0}
            sx={{ py: isMobile ? 1 : 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
              <Edit fontSize={isMobile ? "small" : "medium"} />
            </ListItemIcon>
            <ListItemText
              primary="Editar"
              primaryTypographyProps={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            />
          </ListItem>

          {/* 👁️ Ir a previsualizar (si ya hay paso > 1) */}
          <ListItem
            button
            onClick={() => {
              if (activeStep > 1) {
                setActiveStep(2);
                setDrawerOpen(false);
              }
            }}
            selected={activeStep === 2}
            disabled={activeStep < 2}
            sx={{ py: isMobile ? 1 : 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
              <Preview fontSize={isMobile ? "small" : "medium"} />
            </ListItemIcon>
            <ListItemText
              primary="Previsualizar"
              primaryTypographyProps={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            />
          </ListItem>

          {/* ✅ Ir a resultados (si ya hay paso > 2) */}
          <ListItem
            button
            onClick={() => {
              if (activeStep > 2) {
                setActiveStep(3);
                setDrawerOpen(false);
              }
            }}
            selected={activeStep === 3}
            disabled={activeStep < 3}
            sx={{ py: isMobile ? 1 : 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
              <Assignment fontSize={isMobile ? "small" : "medium"} />
            </ListItemIcon>
            <ListItemText
              primary="Resultados"
              primaryTypographyProps={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
            />
          </ListItem>

          {/* 🚪 Cerrar sesión (siempre visible) */}
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              py: isMobile ? 1 : 1.5,
              mt: 2,
              backgroundColor: 'error.light',
              '&:hover': {
                backgroundColor: 'error.main',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: isMobile ? 40 : 56 }}>
              <LogoutIcon fontSize={isMobile ? "small" : "medium"} sx={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText
              primary="Cerrar Sesión"
              primaryTypographyProps={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </ListItem>
        </List>
      </Drawer>

      {/* 🎯 Contenido principal responsivo */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 1, sm: 3 },
        mt: { xs: 7, sm: 8 },
        // 📱 Permite scroll natural en móviles
        overflow: 'auto',
        minHeight: 'calc(100vh - 56px)',
        '@media (max-width: 768px)': {
          minHeight: 'calc(100vh - 56px)',
          p: 1
        }
      }}>
        <Container maxWidth="lg" sx={{
          padding: { xs: 0, sm: 2 },
          // 📱 Sin máximo en móviles
          maxWidth: { xs: '100%', sm: 'lg' }
        }}>
          {/* 📊 Stepper responsivo */}
          <Paper elevation={2} sx={{
            p: { xs: 1.5, sm: 3 },
            mb: { xs: 2, sm: 3 },
            borderRadius: 2,
            overflow: 'hidden',
            mx: { xs: 0, sm: 'auto' }
          }}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': {
                  fontSize: { xs: '0.7rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                },
                '& .MuiStepConnector-line': {
                  minWidth: { xs: 20, sm: 50 }
                }
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-labelContainer': {
                        maxWidth: { xs: 60, sm: 100, md: 120 }
                      }
                    }}
                  >
                    {isMobile ? label.split(' ')[0] : label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* 🎨 Contenido del paso actual */}
          <Box sx={{
            minHeight: { xs: '300px', sm: '400px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* ⏭️ Controles de navegación responsivos */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mt: { xs: 2, sm: 3 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            {/* ↩️ Botón anterior */}
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<>↩️</>}
              fullWidth={isMobile}
              sx={{
                mb: { xs: 1, sm: 0 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 }
              }}
              size={isMobile ? "small" : "medium"}
            >
              Anterior
            </Button>

            <Box sx={{
              display: 'flex',
              gap: { xs: 1, sm: 2 },
              width: { xs: '100%', sm: 'auto' },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              {/* ➡️ Botón siguiente */}
              {activeStep < 2 && (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!imageSrc || isImageLoading}
                  endIcon={<>→</>}
                  fullWidth={isMobile}
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}
                  size={isMobile ? "small" : "medium"}
                >
                  {activeStep === 0 ? 'Comenzar' : 'Siguiente'}
                </Button>
              )}

              {/* 🔍 Botón de procesar OCR */}
              {activeStep === 2 && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleProcessOCR}
                  disabled={loading || !imageSrc}
                  startIcon={loading ? <CircularProgress size={20} /> : <>🔍</>}
                  fullWidth={isMobile}
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}
                  size={isMobile ? "small" : "medium"}
                >
                  {loading ? 'Procesando...' : 'Procesar OCR'}
                </Button>
              )}
            </Box>
          </Box>

          {/* ℹ️ Información contextual responsiva */}
          {activeStep === 0 && (
            <Alert severity="info" sx={{
              mt: { xs: 2, sm: 3 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 2 }
            }}>
              <Info sx={{
                mr: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                alignSelf: 'flex-start',
                mt: { xs: 0.25, sm: 0.5 }
              }} />
              <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                <strong>📋 Instrucciones:</strong> Sube una foto clara de tu INE o usa la cámara.
                Asegúrate que toda la información sea legible. Formatos soportados: JPEG, PNG, WEBP.
              </Typography>
            </Alert>
          )}

          {activeStep === 1 && imageSrc && (
            <Alert severity="success" sx={{
              mt: { xs: 2, sm: 3 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 2 }
            }}>
              <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                <strong>✅ Imagen lista:</strong> Usa las herramientas para recortar y girar la imagen.
                Cuando estés listo, haz clic en "Siguiente".
              </Typography>
            </Alert>
          )}
        </Container>
      </Box>

      {/* 📷 Componente de cámara */}
      <CameraCapture
        open={cameraOpen}
        onClose={() => {
          console.log('📷 Cerrando cámara');
          setCameraOpen(false);
        }}
        onCapture={handleCameraCapture}
      // 🔧 Cambio: Eliminar la prop isMobile que no existe en CameraCaptureProps
      />

      {/* 🍞 Notificaciones */}
      <ToastContainer
        position={isMobile ? "top-center" : "bottom-right"}
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{
          fontSize: isMobile ? '14px' : '16px',
          margin: isMobile ? '4px' : '8px'
        }}
      />
    </Box>
  );
};

export default App;