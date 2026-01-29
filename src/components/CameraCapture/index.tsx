/**
 * 📷 CameraCapture.tsx
 * =========================================================
 * 🎯 Componente de captura de imagen usando cámara (Webcam)
 *
 * Este componente abre un **Dialog (modal)** con vista previa en vivo
 * de la cámara del dispositivo y permite:
 *
 * ✅ Capturar una foto en formato `image/jpeg` (como DataURL)
 * 🔄 Cambiar entre cámara **frontal** y **trasera**
 * ❌ Cerrar el modal (cancelar)
 *
 * 🧠 Integración:
 * - El padre (App.tsx) controla `open`
 * - Al capturar:
 *   - Se llama `onCapture(imageSrc)`
 *   - Se cierra el modal con `onClose()`
 *
 * 📘 Estilo de documentación:
 * - AngularDoc/JSDoc + muchísimos emojis 😄
 *
 * ⚠️ REGLAS (respetadas al 100%):
 * - ❌ NO se cambia lógica ni funciones
 * - ❌ NO se cambian props ni nombres
 * - ❌ NO se eliminan comentarios existentes
 * - ✅ SOLO se agrega documentación
 * =========================================================
 */

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Box, Button, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';

/**
 * 🧩 CameraCaptureProps
 * ---------------------------------------------------------
 * Contrato de props que debe cumplir el componente.
 *
 * ✅ open:
 * - Controla visibilidad del modal.
 *
 * ✅ onClose:
 * - Callback para cerrar el modal.
 *
 * ✅ onCapture:
 * - Callback que entrega la imagen capturada al componente padre.
 * - `imageSrc` viene como DataURL (ej: "data:image/jpeg;base64,...")
 * ---------------------------------------------------------
 */
interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageSrc: string) => void;
}

/**
 * 📷 CameraCapture
 * =========================================================
 * Componente funcional que encapsula el uso de `react-webcam`.
 *
 * 🔌 Dependencia clave:
 * - `react-webcam` proporciona:
 *   - Vista en vivo de cámara
 *   - Captura con `getScreenshot()`
 *
 * ⚠️ Nota:
 * - En algunos navegadores, para usar cámara en producción,
 *   se requiere HTTPS (en localhost normalmente funciona).
 * =========================================================
 */
const CameraCapture: React.FC<CameraCaptureProps> = ({ open, onClose, onCapture }) => {
  /**
   * 🎥 webcamRef
   * ---------------------------------------------------------
   * Referencia al componente Webcam para acceder a métodos como:
   * - `getScreenshot()`
   *
   * ✅ Se inicializa con `null`
   * y se asigna cuando el componente monta el `<Webcam />`.
   * ---------------------------------------------------------
   */
  const webcamRef = useRef<Webcam>(null);

  /**
   * 📱 facingMode
   * ---------------------------------------------------------
   * Controla qué cámara usar:
   * - 'user'        -> cámara frontal (selfie)
   * - 'environment' -> cámara trasera (ideal para INE)
   *
   * ✅ Valor inicial:
   * - 'environment' (trasera) para mejor captura de documentos
   * ---------------------------------------------------------
   */
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // 📸 Capturar foto
  /**
   * 📸 capture
   * ---------------------------------------------------------
   * Captura una imagen desde la cámara usando:
   * - `webcamRef.current?.getScreenshot()`
   *
   * `getScreenshot()` devuelve:
   * - DataURL (string) o `null` si no hay captura
   *
   * ✅ Si hay imagen:
   * - Llama `onCapture(imageSrc)` para enviarla al padre
   * - Llama `onClose()` para cerrar el modal
   *
   * 🧠 useCallback:
   * - Evita recrear la función en cada render
   * - Útil por performance y estabilidad de referencias
   * ---------------------------------------------------------
   */
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
      onClose();
    }
  }, [webcamRef, onCapture, onClose]);

  // 🔄 Cambiar cámara (frontal/trasera)
  /**
   * 🔄 switchCamera
   * ---------------------------------------------------------
   * Alterna el estado `facingMode`:
   * - user <-> environment
   *
   * 🎯 UX:
   * - Permite al usuario elegir cámara frontal o trasera.
   * - En móviles, “environment” suele ser ideal para documentos.
   * ---------------------------------------------------------
   */
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  /**
   * 🧩 Render del modal
   * =========================================================
   * UI principal:
   * - <Dialog> (MUI) controlado por `open`
   * - <Webcam> con constraints:
   *   - facingMode
   *   - width/height ideal
   *
   * Controles:
   * - Botón para cambiar cámara
   * - Botón para capturar foto
   * =========================================================
   */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        📸 Tomar Foto

        {/**
         * ❌ Botón cerrar (X)
         * - Cierra el modal sin capturar
         */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/**
         * 🎥 Contenedor de cámara
         * - Mantiene una altura fija (400px) para layout consistente
         * - <Webcam> ocupa todo el contenedor (cover)
         */}
        <Box sx={{ position: 'relative', width: '100%', height: 400 }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
          />
        </Box>

        {/**
         * 🎛️ Controles de acciones
         * - Cambiar cámara
         * - Capturar foto
         */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {/* 🔄 Cambiar cámara */}
          <Button
            variant="outlined"
            startIcon={<FlipCameraIosIcon />}
            onClick={switchCamera}
          >
            {facingMode === 'user' ? '📱 Frontal' : '📷 Trasera'}
          </Button>

          {/* 📸 Tomar foto */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<CameraAltIcon />}
            onClick={capture}
            size="large"
          >
            Capturar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;
