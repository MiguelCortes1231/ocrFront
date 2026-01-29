/**
 * 👁️ PreviewPanel.tsx
 * =========================================================
 * 🎯 Componente de previsualización y selección de versión de imagen
 *
 * Este componente corresponde al **Paso 2 (Previsualizar)** del flujo:
 * ✅ Permite al usuario visualizar cuál imagen se enviará al OCR y escoger entre:
 *
 * 🔄 Imagen Original       -> `originalImage`
 * ✂️ Imagen Editada        -> `editedImage`
 * ✨ Imagen Mejorada (IA)  -> `enhancedImage` (opcional)
 *
 * 🧠 Integración con App.tsx:
 * - `currentImage` representa la imagen actualmente seleccionada por el usuario
 * - Los callbacks (`onUseOriginal`, `onUseEdited`, `onUseEnhanced`) actualizan el estado global en App.tsx
 * - `onEnhance` dispara la mejora por IA (si se habilita el bloque comentado)
 * - `isProcessing` muestra spinner cuando se está “mejorando” la imagen
 *
 * 📌 Importante:
 * - Este componente **NO hace OCR**
 * - Este componente **NO modifica imágenes**
 * - Solo **muestra** y **permite seleccionar** la versión
 *
 * 📘 Estilo de documentación:
 * - AngularDoc/JSDoc + emojis 😄
 *
 * ⚠️ REGLAS (respetadas):
 * - ❌ NO se cambia la lógica
 * - ❌ NO se eliminan comentarios ni bloques comentados
 * - ✅ SOLO se agrega documentación
 * =========================================================
 */

import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Grid,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EditIcon from '@mui/icons-material/Edit';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/**
 * 🧩 PreviewPanelProps
 * ---------------------------------------------------------
 * Contrato del componente PreviewPanel.
 *
 * ✅ originalImage:
 * - Imagen base sin modificaciones (DataURL).
 *
 * ✅ editedImage:
 * - Imagen editada desde ImageEditor (DataURL).
 *
 * ✅ enhancedImage (opcional):
 * - Imagen mejorada por IA si existe (DataURL).
 *
 * ✅ currentImage:
 * - Imagen actualmente “seleccionada” para enviar al OCR.
 * - Puede ser igual a original, edited o enhanced.
 *
 * ✅ isProcessing:
 * - Indica que está corriendo un proceso de mejora (UX: spinner).
 *
 * ✅ Callbacks:
 * - onUseOriginal: Selecciona original como currentImage
 * - onUseEdited: Selecciona edited como currentImage
 * - onUseEnhanced: Selecciona enhanced como currentImage
 * - onEnhance: Dispara proceso de mejora (IA)
 * ---------------------------------------------------------
 */
interface PreviewPanelProps {
  originalImage: string;      // Imagen original sin editar
  editedImage: string;        // Imagen editada actual
  enhancedImage?: string;     // Imagen mejorada por IA
  currentImage: string;       // Imagen que se muestra actualmente
  isProcessing: boolean;
  onUseOriginal: () => void;   // Usar imagen original
  onUseEdited: () => void;     // Usar imagen editada
  onUseEnhanced: () => void;   // Usar imagen mejorada
  onEnhance: () => void;       // Mejorar imagen
}

/**
 * 👁️ PreviewPanel
 * =========================================================
 * Renderiza:
 * - Panel principal con la imagen seleccionada y botones para cambiar versión
 * - Panel opcional para la imagen mejorada por IA
 * - Bloques opcionales (comentados) para botón de mejora
 * - Resumen de estados con indicadores visuales
 * =========================================================
 */
const PreviewPanel: React.FC<PreviewPanelProps> = ({
  originalImage,
  editedImage,
  enhancedImage,
  currentImage,
  isProcessing,
  onUseOriginal,
  onUseEdited,
  onUseEnhanced,
  onEnhance
}) => {
  /**
   * 🧠 getCurrentImageType
   * ---------------------------------------------------------
   * Determina qué “tipo” de imagen está actualmente seleccionada.
   *
   * ✅ Regresa:
   * - 'original'  -> currentImage === originalImage
   * - 'edited'    -> currentImage === editedImage
   * - 'enhanced'  -> currentImage === enhancedImage
   * - 'unknown'   -> si no coincide con ninguna (caso raro/edge case)
   *
   * 📌 Uso:
   * - UI de etiqueta (chip/label) y colores de borde
   */
  const getCurrentImageType = () => {
    if (currentImage === originalImage) return 'original';
    if (currentImage === editedImage) return 'edited';
    if (currentImage === enhancedImage) return 'enhanced';
    return 'unknown';
  };

  /**
   * 🏷️ currentType
   * ---------------------------------------------------------
   * Tipo actual (computed) para UI:
   * - define textos “Original/Editada/Mejorada”
   * - define color de borde
   * - define estado disabled de botones
   */
  const currentType = getCurrentImageType();

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      {/* 🏷️ Encabezado del panel + etiqueta del tipo actual */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        👁️ Previsualización
        <Typography variant="caption" sx={{ 
          ml: 2, 
          px: 1, 
          py: 0.5, 
          borderRadius: 1, 
          bgcolor: currentType === 'original' ? 'primary.light' : 
                   currentType === 'edited' ? 'warning.light' : 
                   currentType === 'enhanced' ? 'success.light' : 'grey.300' 
        }}>
          {currentType === 'original' && '🔄 Original'}
          {currentType === 'edited' && '✂️ Editada'}
          {currentType === 'enhanced' && '✨ Mejorada'}
        </Typography>
      </Typography>

      <Grid container spacing={3}>
        {/* 🖼️ Imagen actualmente seleccionada */}
        <Grid item xs={12} md={enhancedImage ? 6 : 12}>
          <Box sx={{ textAlign: 'center' }}>
            {/* 📝 Título dinámico según currentType */}
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              {currentType === 'original' && '🔄 Imagen Original'}
              {currentType === 'edited' && '✂️ Imagen Editada Actual'}
              {currentType === 'enhanced' && '✨ Imagen Mejorada'}
            </Typography>

            {/* 🖼️ Imagen principal (la que se mandará al OCR) */}
            <Box
              component="img"
              src={currentImage}
              alt="Imagen actual"
              sx={{
                maxWidth: '100%',
                maxHeight: 300,
                borderRadius: 1,
                border: '3px solid',
                borderColor: currentType === 'original' ? 'primary.main' : 
                            currentType === 'edited' ? 'warning.main' : 
                            'success.main',
                boxShadow: 2
              }}
            />

            {/* 🎛️ Botones de selección para la imagen actual */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              {/* 🔄 Restablecer a Original */}
              <Tooltip title="Restablecer a la imagen original">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={onUseOriginal}
                  startIcon={<RestartAltIcon />}
                  disabled={currentType === 'original'}
                  fullWidth
                >
                  Restablecer Original
                </Button>
              </Tooltip>

              {/* ✂️ Usar Editada */}
              <Tooltip title="Usar la versión editada actual">
                <Button
                  variant="contained"
                  color="warning"
                  onClick={onUseEdited}
                  startIcon={<EditIcon />}
                  disabled={currentType === 'edited' || editedImage === originalImage}
                  fullWidth
                >
                  Usar Editada
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        {/* ✨ Imagen mejorada por IA */}
        {enhancedImage && (
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <AutoAwesomeIcon color="success" /> Imagen Mejorada por IA
              </Typography>

              {/* 🖼️ Vista previa de enhancedImage */}
              <Box
                component="img"
                src={enhancedImage}
                alt="Mejorada por IA"
                sx={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: 'success.main'
                }}
              />

              {/* ✅ Seleccionar la versión mejorada */}
              <Tooltip title="Usar la versión mejorada por IA">
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={onUseEnhanced}
                  sx={{ mt: 2 }}
                  disabled={currentType === 'enhanced'}
                  fullWidth
                >
                  Usar Versión Mejorada
                </Button>
              </Tooltip>
            </Box>
          </Grid>
        )}

        {/* ⚡ Botón para mejorar imagen */}
        {/*!enhancedImage && !isProcessing && (
          <Grid item xs={12}>
            <Alert 
              severity="info" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: { xs: 'column', sm: 'row' }
              }}
            >
              <Button
                variant="outlined"
                color="info"
                startIcon={<ImageIcon />}
                onClick={onEnhance}
                size="large"
                sx={{ mb: { xs: 2, sm: 0 } }}
              >
                ⚡ Mejorar imagen con IA
              </Button>
              <Typography variant="body2" sx={{ ml: { sm: 2 }, textAlign: 'center' }}>
                El sistema mejorará automáticamente contraste, nitidez y perspectiva
              </Typography>
            </Alert>
          </Grid>
        )*/}

        {/* ⏳ Procesando mejora */}
        {isProcessing && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                ⚡ Mejorando imagen con IA...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Esto puede tardar unos segundos
              </Typography>
            </Box>
          </Grid>
        )}

        {/* ℹ️ Resumen de imágenes disponibles */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              📋 Resumen de Imágenes Disponibles:
            </Typography>

            {/* 🔘 “Semáforo” de disponibilidad/selección */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              {/* 🔄 Original */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="caption">
                  Original: {originalImage === currentImage ? '✅ Seleccionada' : 'Disponible'}
                </Typography>
              </Box>

              {/* ✂️ Editada */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                <Typography variant="caption">
                  Editada: {editedImage === currentImage ? '✅ Seleccionada' : 
                           editedImage !== originalImage ? 'Disponible' : 'Sin cambios'}
                </Typography>
              </Box>

              {/* ✨ Mejorada (solo si existe) */}
              {enhancedImage && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="caption">
                    Mejorada: {enhancedImage === currentImage ? '✅ Seleccionada' : 'Disponible'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PreviewPanel;
