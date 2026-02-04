/**
 * 📤 ImageUploader.tsx
 * =========================================================
 * 🎯 Componente para subir / seleccionar imagen de INE/IFE
 *
 * Este componente representa el **Paso 0** del flujo (wizard):
 * ✅ Permite al usuario:
 * - 📁 Subir una imagen desde archivo (input file)
 * - 🎯 Arrastrar y soltar (drag & drop)
 * - 📸 Abrir la cámara (delegando al padre)
 *
 * 🧠 Integración con App.tsx:
 * - `onImageSelect(file)`:
 *    👉 Envía el archivo válido al padre para que lo convierta a base64/DataURL,
 *       lo guarde como imagen actual y avance al editor.
 *
 * - `onCameraOpen()`:
 *    👉 Abre el modal de cámara en el padre (CameraCapture).
 *
 * ✅ Validaciones incluidas:
 * - Tipo: debe ser `image/*`
 * - Tamaño: máximo 10MB
 *
 * 🎨 UX:
 * - Estado visual cuando hay drag activo (borde punteado + cambio de color)
 * - Alert con info del archivo seleccionado
 * - LinearProgress para indicar “procesando”
 *
 * 📘 Estilo de documentación:
 * - AngularDoc/JSDoc + muchos emojis 😄
 *
 * ⚠️ REGLAS (respetadas al 100%):
 * - ❌ NO se cambia lógica ni funciones
 * - ❌ NO se eliminan comentarios existentes
 * - ✅ SOLO se agrega documentación
 * =========================================================
 */

import React, { useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper,
  Alert,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ImageIcon from '@mui/icons-material/Image';

/**
 * 🧩 ImageUploaderProps
 * ---------------------------------------------------------
 * Contrato de props requerido por el componente.
 *
 * ✅ onImageSelect:
 * - Se dispara cuando el usuario selecciona una imagen válida.
 * - Recibe el archivo ya validado (tipo/tamaño).
 *
 * ✅ onCameraOpen:
 * - Se dispara cuando el usuario decide usar la cámara.
 * - El componente padre decide cómo abrir el modal/cámara.
 * ---------------------------------------------------------
 */
interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  onCameraOpen: () => void;
}

/**
 * 📤 ImageUploader
 * =========================================================
 * Componente funcional para:
 * - Upload tradicional (click -> input file)
 * - Drag & Drop
 * - Apertura de cámara (callback)
 *
 * ⚠️ Nota:
 * - La conversión a Base64/DataURL NO se hace aquí.
 * - Esa responsabilidad pertenece al padre (App.tsx), lo cual es correcto:
 *   - separación de responsabilidades ✅
 * =========================================================
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  onCameraOpen 
}) => {
  /**
   * 📌 fileInputRef
   * ---------------------------------------------------------
   * Referencia al input file oculto para poder disparar `.click()`
   * desde un botón o desde el área de drag.
   */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 🎯 dragActive
   * ---------------------------------------------------------
   * Controla el estado visual del drag & drop:
   * - true  -> resaltado (borde y color)
   * - false -> normal
   */
  const [dragActive, setDragActive] = React.useState(false);

  /**
   * 🧾 selectedFile
   * ---------------------------------------------------------
   * Guarda el archivo seleccionado para mostrar información al usuario.
   *
   * ✅ Se usa solo para UI (Alert + nombre/tamaño/tipo)
   */
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // 📁 Manejar selección de archivo - CORREGIDO
  /**
   * 📁 handleFileChange
   * ---------------------------------------------------------
   * Handler principal del input file.
   *
   * ✅ Flujo:
   * 1) Obtiene files del input
   * 2) Valida que exista al menos 1 archivo
   * 3) Valida tipo (image/*)
   * 4) Valida tamaño (<= 10MB)
   * 5) Guarda selectedFile
   * 6) Llama `onImageSelect(file)` para que el padre procese
   * 7) Limpia el input para permitir seleccionar el mismo archivo otra vez
   *
   * @param event Evento de cambio del input file
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    console.log('📁 Evento de cambio de archivo:', {
      tieneFiles: !!files,
      cantidad: files?.length || 0
    });

    if (!files || files.length === 0) {
      console.warn('⚠️ No se seleccionaron archivos');
      return;
    }

    const file = files[0];

    // 🔍 Validar archivo
    console.log('🔍 Validando archivo:', {
      nombre: file.name,
      tamaño: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      tipo: file.type,
      esImagen: file.type.startsWith('image/')
    });

    if (!file.type.startsWith('image/')) {
      console.error('❌ Archivo no es imagen:', file.type);
      alert('❌ Por favor, selecciona un archivo de imagen (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB límite
      console.error('❌ Archivo demasiado grande:', file.size);
      alert('❌ El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    // ✅ Archivo válido
    setSelectedFile(file);
    console.log('✅ Archivo validado correctamente');

    // 🚀 Enviar archivo al padre (App.tsx)
    onImageSelect(file);

    // 🔄 Limpiar input para permitir seleccionar el mismo archivo otra vez
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 📸 Abrir selector de archivos
  /**
   * 📁 handleUploadClick
   * ---------------------------------------------------------
   * Dispara manualmente el selector del sistema operativo (file picker)
   * usando la referencia al input oculto.
   */
  const handleUploadClick = () => {
    console.log('📁 Abriendo selector de archivos...');
    fileInputRef.current?.click();
  };

  // 🎯 Manejar drag & drop
  /**
   * 🎯 handleDrag
   * ---------------------------------------------------------
   * Controla el estado `dragActive` dependiendo del evento:
   * - dragenter / dragover -> true (UI resaltada)
   * - dragleave           -> false (UI normal)
   *
   * ✅ preventDefault + stopPropagation:
   * - Evita que el navegador intente abrir el archivo en la pestaña
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * 📥 handleDrop
   * ---------------------------------------------------------
   * Maneja cuando el usuario suelta un archivo sobre el contenedor.
   *
   * ✅ Flujo:
   * - Desactiva dragActive
   * - Si hay archivo:
   *   - Construye un “evento simulado” para reutilizar `handleFileChange`
   *
   * 🧠 Ventaja:
   * - Reutiliza la misma lógica de validación.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {

      // Simular un cambio de input
      const event = {
        target: {
          files: e.dataTransfer.files
        }
      } as React.ChangeEvent<HTMLInputElement>;

      handleFileChange(event);
    }
  };

  /**
   * 🎨 Render principal
   * =========================================================
   * UI:
   * - Título de la app
   * - Área de drag & drop (clickable)
   * - Botones:
   *   - Subir desde archivo
   *   - Usar cámara
   * - Input oculto file
   * - Alert del archivo seleccionado
   * - Consejos de captura
   * =========================================================
   */
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        textAlign: 'center',
        borderRadius: 3,
        backgroundColor: 'background.paper',
        border: dragActive ? '2px dashed #1976d2' : '2px solid transparent',
        transition: 'border 0.3s ease'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        🪪 Escáner de INE/IFE
      </Typography>

      <Typography variant="h6" gutterBottom color="primary">
        📷 Subir Imagen de Credencial
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
        Selecciona una imagen del <strong>anverso</strong> o <strong>reverso</strong> de tu credencial INE/IFE
      </Typography>

      {/* 🎯 Área de arrastrar y soltar */}
      <Box
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 4,
          mb: 3,
          backgroundColor: dragActive ? 'primary.light' : 'grey.50',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.light'
          }
        }}
        onClick={handleUploadClick}
      >
        <ImageIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {dragActive ? '🔄 Suelta la imagen aquí' : '📁 Arrastra y suelta tu imagen aquí'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          o haz clic para seleccionar un archivo
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          Formatos: JPEG, PNG, WEBP • Máximo: 10MB
        </Typography>
      </Box>

      {/* 📊 Botones de acción */}
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 📁 Botón para subir archivo */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={handleUploadClick}
          fullWidth
          size="large"
          sx={{ py: 1.5 }}
        >
          📁 Subir desde Archivo
        </Button>

        {/* 📸 Botón para abrir cámara 
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PhotoCameraIcon />}
          onClick={onCameraOpen}
          fullWidth
          size="large"
          sx={{ py: 1.5 }}
        >
          📸 Usar Cámara
        </Button>
        */}
      </Box>

      {/* 🏷️ Input oculto para archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* 📋 Información del archivo seleccionado */}
      {selectedFile && (
        <Alert 
          severity="success" 
          sx={{ mt: 3, textAlign: 'left' }}
          icon={<ImageIcon />}
        >
          <Typography variant="subtitle2" gutterBottom>
            ✅ Archivo seleccionado:
          </Typography>
          <Typography variant="body2">
            <strong>Nombre:</strong> {selectedFile.name}
          </Typography>
          <Typography variant="body2">
            <strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
          <Typography variant="body2">
            <strong>Tipo:</strong> {selectedFile.type}
          </Typography>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ mt: 1 }} 
            color="success"
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            ⏳ Procesando imagen...
          </Typography>
        </Alert>
      )}

      {/* 📝 Consejos útiles */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: 'info.light', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          💡 Consejos para una mejor captura:
        </Typography>
        <Box component="ul" sx={{ textAlign: 'left', pl: 2, mb: 0 }}>
          <Typography component="li" variant="body2">
            <strong>Buena iluminación:</strong> Evita sombras y reflejos
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Enfoca bien:</strong> Asegúrate que el texto sea legible
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Ángulo recto:</strong> Toma la foto de frente a la credencial
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Fondo limpio:</strong> Usa un fondo contrastante
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default ImageUploader;
