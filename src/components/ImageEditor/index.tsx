/**
 * ✂️ ImageEditor.tsx
 * =========================================================
 * 🎯 Editor de imagen (recorte + rotación + historial) para preparar la INE/IFE antes del OCR
 *
 * Este componente es el “taller” donde el usuario mejora la imagen para que el OCR tenga
 * mejores resultados (menos ruido, mejor encuadre, orientación correcta).
 *
 * ✅ Funcionalidades clave:
 * - ✂️ Recorte (crop) con `react-image-crop` (proporción de tarjeta ID)
 * - 🔄 Rotación visual (preview) + “Aplicar rotación” (commit al DataURL)
 * - 📜 Historial de cambios (Undo/Redo)
 * - 🔄 Restablecer cambios (con confirmación) -> llama al padre para volver a original
 * - 🧪 Validación de DataURL y precarga de imagen (Image()) para detectar errores
 * - ⏳ Estados UX: cargando, procesando, overlay, snackbar y diálogo de confirmación
 *
 * 🧠 Integración con App.tsx:
 * - Recibe `imageSrc` (DataURL actual)
 * - Emite `onImageChange(dataURL)` para que App actualice el estado global
 * - Emite `onCropComplete(pixelCrop)` para reportar recorte (si se quiere registrar)
 * - Usa `onResetToOriginal()` (del padre) para reiniciar totalmente a imagen original
 *
 * 📘 Estilo de documentación:
 * - AngularDoc/JSDoc + muchos emojis 😄
 *
 * ⚠️ REGLAS (respetadas):
 * - ❌ NO se cambia lógica, nombres, orden ni funciones
 * - ❌ NO se eliminan comentarios existentes
 * - ✅ SOLO se agrega documentación explicativa
 * =========================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  Box, 
  Paper, 
  Button, 
  Typography, 
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  RotateLeft,
  RotateRight,
  Crop as CropIcon,
  Undo,
  Redo,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  Save,
  Warning
} from '@mui/icons-material';

/**
 * 🧩 ImageEditorProps
 * ---------------------------------------------------------
 * Contrato del componente.
 *
 * ✅ imageSrc:
 * - Imagen (DataURL) que se va a editar.
 *
 * ✅ onImageChange:
 * - Emite la nueva imagen (DataURL) cuando:
 *   - se aplica rotación (commit)
 *   - se aplica recorte (commit)
 *   - se hace undo/redo
 *
 * ✅ onCropComplete:
 * - Notifica el recorte final (PixelCrop) cuando se completa un recorte.
 *
 * ✅ onResetToOriginal:
 * - Callback del padre para restablecer la imagen original globalmente.
 * - Este componente también resetea estados locales (rotate/crop/historial).
 * ---------------------------------------------------------
 */
interface ImageEditorProps {
  imageSrc: string;
  onImageChange: (imageData: string) => void;
  onCropComplete: (crop: PixelCrop) => void;
  onResetToOriginal: () => void; // 🔄 Nueva prop
}

/**
 * ✂️ ImageEditor
 * =========================================================
 * Editor de imagen con UI rica (MUI) y edición basada en DataURL.
 *
 * 🔥 Concepto importante:
 * - La rotación que se ve en la vista previa (`rotate`) es SOLO visual
 *   hasta que el usuario presiona “Aplicar Rotación”.
 * - El recorte sí se “commitea” cuando se presiona “Aplicar Recorte”.
 *
 * 📜 Historial:
 * - Se guarda como array de DataURLs
 * - `historyIndex` indica la versión activa
 * =========================================================
 */
const ImageEditor: React.FC<ImageEditorProps> = ({ 
  imageSrc, 
  onImageChange,
  onCropComplete,
  onResetToOriginal // 🔄 Recibir la prop
}) => {
  // 🔧 Estados de edición
  /**
   * ✂️ crop
   * - Representa el área de recorte seleccionada por el usuario.
   * - Se maneja con `ReactCrop`.
   */
  const [crop, setCrop] = useState<Crop>();

  /**
   * ✂️ isCropping
   * - Activa/desactiva el modo recorte.
   * - Si está desactivado:
   *   - el recorte no se puede modificar
   *   - no se muestra botón de “Aplicar recorte”
   */
  const [isCropping, setIsCropping] = useState<boolean>(false);

  /**
   * 🔄 rotate
   * - Grados de rotación SOLO para vista previa.
   * - Se “aplica” realmente con `applyRotation()`.
   */
  const [rotate, setRotate] = useState<number>(0);

  /**
   * ✅ imageLoaded
   * - Indica que la imagen fue precargada y está lista para editar.
   * - Mientras es false, muestra un skeleton/loader.
   */
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  /**
   * ❌ imageError
   * - Mensaje de error si la imagen no es válida o falla carga.
   */
  const [imageError, setImageError] = useState<string>('');

  /**
   * ⏳ isProcessing
   * - Bloquea acciones y muestra overlay cuando se aplica rotación/crop.
   */
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  /**
   * 📐 imageDimensions
   * - Guarda dimensiones reales de la imagen precargada.
   * - Se muestran en UI como metadata (ancho x alto).
   */
  const [imageDimensions, setImageDimensions] = useState<{width: number, height: number}>({width: 0, height: 0});

  // 📜 Historial de acciones
  /**
   * 📜 history
   * - Lista de versiones de la imagen (DataURL) en orden.
   * - Cada “commit” agrega una entrada:
   *   - applyRotation() -> push(newDataURL)
   *   - applyCrop() -> push(newDataURL)
   *   - Undo/Redo selecciona una entrada existente
   */
  const [history, setHistory] = useState<string[]>([imageSrc]);

  /**
   * 📍 historyIndex
   * - Índice actual dentro del historial.
   * - Determina qué imagen se muestra (`history[historyIndex]`)
   */
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // 🚨 Estado para confirmación de reset
  /**
   * ⚠️ confirmResetOpen
   * - Controla el Dialog de confirmación para reset total.
   */
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);

  // 🖼️ Referencias
  /**
   * 🖼️ imgRef
   * - Referencia al elemento `<img>` visible.
   * - Se usa para obtener dimensiones reales y dibujar en canvas.
   */
  const imgRef = useRef<HTMLImageElement>(null);

  /**
   * 🎨 canvasRef
   * - Canvas oculto usado para aplicar rotación y generar DataURL.
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * ✂️ cropCanvasRef
   * - Canvas oculto usado para aplicar recorte y generar DataURL recortado.
   */
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  // 🔔 Notificaciones
  /**
   * 🔔 snackbar
   * - Estado centralizado para notificaciones tipo “toast” interno.
   * - severity: success | error | info (se usa para semántica, aunque Snackbar solo muestra message)
   */
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 🔍 Verificar cuando la imagen cambia desde el padre
  /**
   * 🔁 useEffect(imageSrc)
   * ---------------------------------------------------------
   * Se ejecuta cada vez que el padre (App) cambia `imageSrc`.
   *
   * ✅ Objetivo:
   * - Reiniciar el editor y su historial con la nueva imagen
   * - Validar que sea DataURL
   * - Precargar la imagen para obtener dimensiones y detectar errores
   *
   * 🧪 Incluye:
   * - Validación: `data:image`
   * - Reset de estados: rotate, crop, isCropping, historial
   * - Precarga usando `new Image()`
   * - Timeout de seguridad (3s) para no bloquear UX
   * ---------------------------------------------------------
   */
  useEffect(() => {
    console.log('🖼️ ImageEditor - Imagen recibida del padre:', {
      tieneSrc: !!imageSrc,
      longitud: imageSrc?.length || 0,
      esDataUrl: imageSrc?.startsWith('data:image')
    });

    if (!imageSrc || !imageSrc.startsWith('data:image')) {
      setImageError('❌ La imagen no es válida');
      setImageLoaded(false);
      return;
    }

    // Siempre reiniciar el editor cuando cambia la imagen del padre
    console.log('🔁 Reiniciando editor con nueva imagen');
    setImageLoaded(false);
    setImageError('');
    setRotate(0);
    setCrop(undefined);
    setIsCropping(false);

    // Reiniciar historial con la nueva imagen
    setHistory([imageSrc]);
    setHistoryIndex(0);

    // 🏁 Precargar la imagen
    const img = new Image();
    img.onload = () => {
      console.log('✅ Imagen precargada correctamente:', {
        ancho: img.width,
        alto: img.height
      });
      setImageDimensions({width: img.width, height: img.height});
      setImageLoaded(true);
      showSnackbar('✅ Imagen lista para editar', 'success');
    };

    img.onerror = () => {
      console.error('❌ Error precargando imagen');
      setImageError('La imagen está corrupta o no se puede cargar');
      setImageLoaded(false);
    };

    img.src = imageSrc;

    // ⏳ Timeout de seguridad
    const timeout = setTimeout(() => {
      if (!imageLoaded) {
        console.warn('⚠️ Timeout de carga de imagen - forzando estado');
        setImageLoaded(true);
        showSnackbar('⚠️ Imagen cargada (modo forzado)', 'info');
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [imageSrc]); // Solo dependemos de imageSrc del padre

  // 🔄 Aplicar rotación a la imagen actual
  /**
   * 🔄 applyRotation
   * ---------------------------------------------------------
   * “Commitea” la rotación al DataURL (la vuelve parte real de la imagen).
   *
   * ✅ Requisitos:
   * - imgRef listo
   * - canvasRef listo
   *
   * 🔁 Flujo:
   * - Configura canvas con dimensiones naturales del img
   * - Limpia canvas
   * - ctx.save() -> translate center -> rotate -> translate back
   * - drawImage
   * - ctx.restore()
   * - canvas.toDataURL('image/jpeg', 0.9)
   * - onImageChange(newDataURL) (actualiza estado global en App)
   * - push al historial + mueve historyIndex
   * - reset rotate a 0
   *
   * ⏳ setTimeout(100):
   * - Da tiempo al render/estado antes de procesar (UI/UX suave)
   * ---------------------------------------------------------
   */
  const applyRotation = () => {
    console.log('🎨 Aplicando rotación:', { rotate });

    if (!imgRef.current || !canvasRef.current) {
      console.warn('⚠️ Recursos no listos');
      showSnackbar('⚠️ Imagen no está lista aún', 'error');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const img = imgRef.current!;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('No se pudo obtener contexto 2D');
        }

        // 📐 Tamaño del canvas
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        // 🎨 Limpiar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 🏁 Guardar estado
        ctx.save();

        // 🔄 Mover al centro para rotación
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // 🔄 Aplicar rotación
        ctx.rotate((rotate * Math.PI) / 180);

        // 🔙 Mover de vuelta
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        // 🖼️ Dibujar imagen
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 🔙 Restaurar contexto
        ctx.restore();

        // 💾 Generar nueva imagen
        const newImageData = canvas.toDataURL('image/jpeg', 0.9);

        // 📤 Notificar al padre del cambio
        onImageChange(newImageData);

        // 📜 Guardar en historial
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newImageData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // 🔄 Resetear rotación después de aplicar
        setRotate(0);

        showSnackbar('✅ Rotación aplicada', 'success');
        console.log('✅ Rotación aplicada correctamente');

      } catch (error) {
        console.error('❌ Error aplicando rotación:', error);
        showSnackbar('❌ Error al aplicar rotación', 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  // ✂️ Aplicar recorte
  /**
   * ✂️ applyCrop
   * ---------------------------------------------------------
   * “Commitea” el recorte al DataURL generando una nueva imagen recortada.
   *
   * ✅ Requisitos:
   * - crop válido
   * - imgRef listo
   * - cropCanvasRef listo
   *
   * 🔁 Flujo:
   * - Calcula escalas:
   *   - naturalWidth / displayedWidth
   *   - naturalHeight / displayedHeight
   * - Convierte Crop (UI) -> PixelCrop real (en pixeles naturales)
   * - Configura canvas al tamaño del recorte
   * - drawImage() usando coordenadas del recorte
   * - canvas.toDataURL('image/jpeg', 0.9)
   * - onImageChange(croppedDataURL)
   * - push historial + index
   * - resetea crop/isCropping/rotate
   * - notifica `onCropComplete({ ...pixelCrop, unit:'px' })`
   * ---------------------------------------------------------
   */
  const applyCrop = () => {
    console.log('✂️ Aplicando recorte:', { crop });

    if (!crop || !imgRef.current || !cropCanvasRef.current) {
      showSnackbar('⚠️ Selecciona un área para recortar', 'error');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const img = imgRef.current!;
        const canvas = cropCanvasRef.current!;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('No se pudo obtener contexto 2D');
        }

        // 📐 Calcular dimensiones del recorte
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        const pixelCrop = {
          x: crop.x * scaleX,
          y: crop.y * scaleY,
          width: crop.width * scaleX,
          height: crop.height * scaleY
        };

        // 🎨 Configurar canvas del recorte
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // 🖼️ Dibujar la porción recortada
        ctx.drawImage(
          img,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        // 💾 Generar imagen recortada
        const croppedImageData = canvas.toDataURL('image/jpeg', 0.9);

        // 📤 Notificar al padre del cambio
        onImageChange(croppedImageData);

        // 📜 Guardar en historial
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(croppedImageData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // 🔧 Resetear estados de recorte
        setCrop(undefined);
        setIsCropping(false);
        setRotate(0); // Resetear rotación después del recorte

        showSnackbar('✅ Imagen recortada', 'success');
        onCropComplete({
          x: pixelCrop.x,
          y: pixelCrop.y,
          width: pixelCrop.width,
          height: pixelCrop.height,
          unit: 'px'
        });

        console.log('✅ Recorte aplicado correctamente:', pixelCrop);

      } catch (error) {
        console.error('❌ Error al recortar:', error);
        showSnackbar('❌ Error al recortar', 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  // 🖼️ Manejar carga de imagen en el elemento img
  /**
   * ✅ handleImageLoad
   * ---------------------------------------------------------
   * Callback al cargar la imagen del `<img>` visible.
   * Útil para logs y debugging.
   */
  const handleImageLoad = () => {
    console.log('✅ Imagen cargada en vista previa');
  };

  /**
   * ❌ handleImageError
   * ---------------------------------------------------------
   * Callback si falla la carga del `<img>` visible.
   * Muestra snackbar y deja evidencia en consola.
   */
  const handleImageError = () => {
    console.error('❌ Error cargando vista previa');
    showSnackbar('⚠️ Error cargando la vista previa', 'error');
  };

  // 🔄 Girar imagen (solo actualiza vista previa)
  /**
   * ↶ rotateLeft
   * ---------------------------------------------------------
   * Ajusta el estado `rotate` (-90°).
   * ⚠️ Solo cambia la vista previa (no se comitea hasta "Aplicar Rotación").
   */
  const rotateLeft = () => {
    const newRotate = rotate - 90;
    setRotate(newRotate);
    showSnackbar('↪️ Imagen girada a la izquierda', 'info');
  };

  /**
   * ↷ rotateRight
   * ---------------------------------------------------------
   * Ajusta el estado `rotate` (+90°).
   * ⚠️ Solo cambia la vista previa (no se comitea hasta "Aplicar Rotación").
   */
  const rotateRight = () => {
    const newRotate = rotate + 90;
    setRotate(newRotate);
    showSnackbar('↪️ Imagen girada a la derecha', 'info');
  };

  // 🎯 Activar/Desactivar modo recorte
  /**
   * ✂️ toggleCropping
   * ---------------------------------------------------------
   * Alterna el modo recorte.
   *
   * ✅ Si se desactiva:
   * - Limpia crop
   * - Notifica que el modo se apagó
   *
   * ✅ Si se activa:
   * - Notifica que el usuario debe seleccionar un área
   */
  const toggleCropping = () => {
    setIsCropping(!isCropping);
    if (isCropping) {
      setCrop(undefined);
      showSnackbar('✂️ Modo recorte desactivado', 'info');
    } else {
      showSnackbar('✂️ Modo recorte activado - Selecciona un área', 'info');
    }
  };

  // ↩️ Deshacer
  /**
   * ↩️ undo
   * ---------------------------------------------------------
   * Retrocede una versión en el historial si es posible.
   *
   * ✅ Efectos:
   * - historyIndex--
   * - rotate reset a 0
   * - onImageChange(previousImage) para sincronizar App
   */
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousImage = history[newIndex];

      setHistoryIndex(newIndex);
      setRotate(0); // Resetear rotación al deshacer
      onImageChange(previousImage); // Notificar al padre

      showSnackbar('↩️ Cambio deshecho', 'success');
    }
  };

  // ↪️ Rehacer
  /**
   * ↪️ redo
   * ---------------------------------------------------------
   * Avanza una versión en el historial si es posible.
   *
   * ✅ Efectos:
   * - historyIndex++
   * - rotate reset a 0
   * - onImageChange(nextImage) para sincronizar App
   */
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextImage = history[newIndex];

      setHistoryIndex(newIndex);
      setRotate(0); // Resetear rotación al rehacer
      onImageChange(nextImage); // Notificar al padre

      showSnackbar('↪️ Cambio rehecho', 'success');
    }
  };

  // 🔄 Abrir diálogo de confirmación para reset
  /**
   * ⚠️ openResetConfirm
   * ---------------------------------------------------------
   * Abre el modal de confirmación antes de restablecer todo.
   * Protege contra “misclicks” (UX).
   */
  const openResetConfirm = () => {
    setConfirmResetOpen(true);
  };

  // 🔄 Confirmar reset a imagen original
  /**
   * 🔄 confirmResetAll
   * ---------------------------------------------------------
   * Restablece TODO:
   *
   * ✅ Local:
   * - rotate = 0
   * - crop undefined
   * - isCropping false
   * - history reset (con la imagen actual como base)
   *
   * ✅ Global (Padre):
   * - onResetToOriginal() -> App vuelve a originalImage y limpia enhanced
   *
   * Finalmente:
   * - Cierra diálogo
   * - Muestra snackbar success
   */
  const confirmResetAll = () => {
    console.log('🔄 Confirmando restablecimiento total');

    // 🔧 Resetear estados locales
    setRotate(0);
    setCrop(undefined);
    setIsCropping(false);

    // 📜 Reiniciar historial local
    setHistory([imageSrc]);
    setHistoryIndex(0);

    // 🚀 Llamar a la función del padre para restablecer la imagen original
    onResetToOriginal();

    // Cerrar diálogo
    setConfirmResetOpen(false);

    showSnackbar('🔄 Todos los cambios restablecidos', 'success');
  };

  // ❌ Cancelar reset
  /**
   * ❌ cancelReset
   * ---------------------------------------------------------
   * Cierra el diálogo de confirmación sin cambiar nada.
   */
  const cancelReset = () => {
    setConfirmResetOpen(false);
    showSnackbar('❌ Restablecimiento cancelado', 'info');
  };

  // 🔔 Mostrar notificación
  /**
   * 🔔 showSnackbar
   * ---------------------------------------------------------
   * Helper para disparar notificaciones internas.
   *
   * @param message  🧾 Texto a mostrar
   * @param severity 🎚️ Nivel semántico ('success'|'error'|'info')
   */
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 🖼️ Estilo CSS para vista previa (SOLO ROTACIÓN)
  /**
   * 🎨 imageStyle
   * ---------------------------------------------------------
   * CSS inline del `<img>` para la vista previa.
   *
   * ⚠️ Muy importante:
   * - Solo aplica `transform: rotate(${rotate}deg)`
   * - Esto NO altera el DataURL final hasta que se “aplica” con canvas.
   */
  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '400px',
    display: 'block',
    transform: `rotate(${rotate}deg)`,
    transition: 'transform 0.3s ease',
  };

  // 🚨 Si hay error
  /**
   * 🚨 Estado de error crítico
   * - Se muestra un panel rojo con explicación
   * - Incluye botón para recargar la página
   */
  if (imageError) {
    return (
      <Paper elevation={3} sx={{ 
        p: 4, 
        borderRadius: 2, 
        textAlign: 'center',
        backgroundColor: 'error.light'
      }}>
        <ErrorIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom color="error">
          ⚠️ Error de Imagen
        </Typography>
        <Typography variant="body1" paragraph>
          {imageError}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          🔄 Recargar
        </Button>
      </Paper>
    );
  }

  // ⏳ Si la imagen está cargando
  /**
   * ⏳ Estado de carga
   * - Evita que el editor se muestre sin imagen lista
   * - Mejora UX
   */
  if (!imageLoaded) {
    return (
      <Paper elevation={3} sx={{ 
        p: 4, 
        borderRadius: 2, 
        textAlign: 'center'
      }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          ⏳ Preparando Editor...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cargando y verificando imagen
        </Typography>
      </Paper>
    );
  }

  /**
   * 🧩 Render principal del editor
   * =========================================================
   * Layout en 2 columnas:
   * - Izquierda: vista previa + herramientas (crop/rotate/history/reset)
   * - Derecha: instrucciones + estado + consejos
   *
   * Canvas ocultos:
   * - canvasRef: rotación (commit)
   * - cropCanvasRef: recorte (commit)
   *
   * Snackbars:
   * - Snackbar interno para feedback rápido al usuario
   *
   * Dialog:
   * - Confirmación para reset total
   * =========================================================
   */
  return (
    <>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            ✂️ Editor de Imagen
          </Typography>

          {/* 📊 Información de la imagen */}
          <Card variant="outlined" sx={{ p: 1 }}>
            <Typography variant="caption" color="text.secondary">
              📐 {imageDimensions.width} × {imageDimensions.height}px | 🔄 {rotate}° | 📜 {historyIndex + 1}/{history.length}
            </Typography>
          </Card>
        </Box>

        <Grid container spacing={3}>
          {/* 🖼️ Columna izquierda - Visualización */}
          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  👁️ Vista Previa {isCropping && '(Modo Recorte)'}
                </Typography>

                {/* 🎯 Controles de recorte */}
                {isCropping && crop && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<Save />}
                    onClick={applyCrop}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '✂️ Procesando...' : '✂️ Aplicar Recorte'}
                  </Button>
                )}
              </Box>

              <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 1, minHeight: 300 }}>
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => {
                    console.log('🎯 Recorte seleccionado:', c);
                    if (c.width && c.height) {
                      onCropComplete(c);
                    }
                  }}
                  aspect={isCropping ? 85.6 / 53.98 : undefined}
                  ruleOfThirds
                  disabled={!isCropping}
                >
                  {/* 🖼️ Usar la imagen actual del historial */}
                  <img
                    ref={imgRef}
                    src={history[historyIndex]} // Usar imagen del historial
                    alt="Imagen para editar"
                    style={imageStyle}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                </ReactCrop>

                {/* ⏳ Overlay de carga */}
                {isProcessing && (
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1
                  }}>
                    <CircularProgress size={40} sx={{ color: 'white' }} />
                  </Box>
                )}
              </Box>

              {/* 🎛️ Barra de herramientas */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                {/* ✂️ Botón de recorte */}
                <Tooltip title={isCropping ? "Desactivar recorte" : "Activar recorte"}>
                  <IconButton 
                    onClick={toggleCropping} 
                    size="medium"
                    color={isCropping ? "primary" : "default"}
                  >
                    <CropIcon />
                  </IconButton>
                </Tooltip>

                {/* 🔄 Girar izquierda */}
                <Tooltip title="Girar a la izquierda (-90°)">
                  <IconButton 
                    onClick={rotateLeft}
                    size="medium"
                    disabled={isProcessing}
                  >
                    <RotateLeft />
                  </IconButton>
                </Tooltip>

                {/* 🔄 Girar derecha */}
                <Tooltip title="Girar a la derecha (+90°)">
                  <IconButton 
                    onClick={rotateRight}
                    size="medium"
                    disabled={isProcessing}
                  >
                    <RotateRight />
                  </IconButton>
                </Tooltip>

                {/* 💾 Aplicar rotación */}
                <Tooltip title="Aplicar rotación a la imagen">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CheckCircle />}
                    onClick={applyRotation}
                    disabled={isProcessing || rotate === 0}
                    sx={{ ml: 1 }}
                  >
                    {isProcessing ? 'Procesando...' : 'Aplicar Rotación'}
                  </Button>
                </Tooltip>

                {/* ↩️ Deshacer */}
                <Tooltip title="Deshacer">
                  <span>
                    <IconButton 
                      onClick={undo} 
                      disabled={historyIndex === 0 || isProcessing}
                      size="medium"
                    >
                      <Undo />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* ↪️ Rehacer */}
                <Tooltip title="Rehacer">
                  <span>
                    <IconButton 
                      onClick={redo} 
                      disabled={historyIndex === history.length - 1 || isProcessing}
                      size="medium"
                    >
                      <Redo />
                    </IconButton>
                  </span>
                </Tooltip>

                {/* 🔄 Restablecer todo */}
                <Tooltip title="Restablecer a imagen original">
                  <IconButton 
                    onClick={openResetConfirm}
                    size="medium"
                    color="secondary"
                    disabled={isProcessing}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* 📋 Información del recorte */}
              {crop && isCropping && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    📏 Recorte seleccionado: {Math.round(crop.width)}×{Math.round(crop.height)}px
                  </Typography>
                </Alert>
              )}

              {/* 📊 Estado actual */}
              <Alert 
                severity={historyIndex === 0 ? "info" : "success"} 
                sx={{ mt: 2 }}
              >
                <Typography variant="caption">
                  {historyIndex === 0 
                    ? "🟡 Imagen original" 
                    : `✅ Imagen editada (cambio ${historyIndex})`}
                </Typography>
              </Alert>
            </Card>
          </Grid>

          {/* 📝 Columna derecha - Información */}
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                🛠️ Instrucciones
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* ✅ Estado */}
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    ✅ Imagen lista para editar
                  </Typography>
                </Alert>

                {/* ✂️ Recorte */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CropIcon color="primary" />
                  <Box>
                    <Typography variant="subtitle2">Recorte</Typography>
                    <Typography variant="caption" color="text.secondary">
                      1. Activa ✂️ modo recorte<br/>
                      2. Selecciona el área de la INE<br/>
                      3. Haz clic en "Aplicar Recorte"
                    </Typography>
                  </Box>
                </Box>

                {/* 🔄 Rotación */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <RotateLeft color="secondary" />
                  <Box>
                    <Typography variant="subtitle2">Rotación</Typography>
                    <Typography variant="caption" color="text.secondary">
                      1. Gira la imagen con ↶ o ↷<br/>
                      2. Haz clic en "Aplicar Rotación"<br/>
                      3. Los cambios se guardan automáticamente
                    </Typography>
                  </Box>
                </Box>

                {/* ↩️ Historial */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Undo color="action" />
                  <Box>
                    <Typography variant="subtitle2">Historial</Typography>
                    <Typography variant="caption" color="text.secondary">
                      • ↩️ Deshacer: Retrocede un cambio<br/>
                      • ↪️ Rehacer: Avanza un cambio<br/>
                      • 🔄 Restablecer: Vuelve al inicio
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* 🔄 Botón de reset */}
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Refresh />}
                onClick={openResetConfirm}
                fullWidth
                disabled={isProcessing || historyIndex === 0}
                sx={{ mt: 3 }}
              >
                🔄 Restablecer a imagen original
              </Button>

              {/* 📊 Estado del historial */}
              <Card variant="outlined" sx={{ p: 1.5, backgroundColor: 'grey.50', mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>📜 Historial:</span>
                  <span>{historyIndex + 1} / {history.length} cambios</span>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {historyIndex === 0 
                    ? "Actualmente en la imagen original" 
                    : `${historyIndex} cambio(s) aplicado(s)`}
                </Typography>
              </Card>
            </Card>

            {/* 💡 Consejos */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                💡 <strong>Consejos:</strong><br/>
                • Recorta solo el área de la INE para mejor OCR<br/>
                • Gira la imagen si está inclinada<br/>
                • Asegúrate que el texto sea legible<br/>
                • Usa Deshacer/Rehacer si cometes errores
              </Typography>
            </Alert>
          </Grid>
        </Grid>

        {/* 🎨 Canvas oculto para procesamiento */}
        <canvas
          ref={canvasRef}
          style={{ display: 'none' }}
        />

        {/* ✂️ Canvas oculto para recorte */}
        <canvas
          ref={cropCanvasRef}
          style={{ display: 'none' }}
        />
      </Paper>

      {/* 🔔 Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* 🚨 Diálogo de confirmación para reset */}
      <Dialog
        open={confirmResetOpen}
        onClose={cancelReset}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Confirmar restablecimiento
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres restablecer todos los cambios?
            <br/>
            <br/>
            <strong>⚠️ Esto eliminará:</strong>
            <br/>
            • Todos los recortes aplicados
            <br/>
            • Todas las rotaciones aplicadas
            <br/>
            • Todo el historial de cambios
            <br/>
            <br/>
            La imagen volverá a su estado original.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelReset} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmResetAll} color="secondary" autoFocus>
            Sí, restablecer todo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageEditor;
