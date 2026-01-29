/**
 * 📄 OCRResults.tsx
 * =========================================================
 * 🎯 Componente de presentación (UI) para mostrar resultados del OCR
 *
 * Este componente se encarga de **renderizar** (mostrar) los datos extraídos por el backend OCR
 * para credenciales INE/IFE, tanto:
 *
 * 🪪 ANVERSO (INEData)
 * 🔙 REVERSO (ReversoData)
 *
 * ✅ Incluye:
 * - ⏳ Estado de carga (spinner)
 * - ❌ Estado de error (alert)
 * - 📝 Estado vacío (sin data)
 * - ✅ Render de tablas/campos con copy-to-clipboard
 * - 🖼️ Sección opcional de "Imagen Procesada" (para comparar lo enviado al API)
 * - 📊 Resumen final del procesamiento (chips)
 *
 * 🧠 Integración con App.tsx:
 * - App llama a la API (anverso/reverso) y pasa:
 *   - data (resultado JSON)
 *   - isReverso (bool)
 *   - loading (bool)
 *   - error (string opcional)
 *   - processedImage (DataURL opcional)
 *   - imageComparison (opcional: originalImage vs processedImage + confidence)
 *
 * 📘 Estilo de documentación:
 * - AngularDoc/JSDoc + emojis 😄
 *
 * ⚠️ REGLAS (respetadas):
 * - ❌ NO se cambia lógica ni estructura del componente
 * - ❌ NO se elimina código
 * - ✅ SOLO se agrega documentación
 * =========================================================
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ImageIcon from '@mui/icons-material/Image';
import CompareIcon from '@mui/icons-material/Compare';
import type { INEData, ReversoData } from '../../types';

/**
 * 🧩 OCRResultsProps
 * ---------------------------------------------------------
 * Contrato de propiedades que recibe el componente.
 *
 * ✅ data:
 * - Puede ser:
 *   - INEData (anverso)
 *   - ReversoData (reverso)
 *   - null (cuando aún no hay resultados)
 *
 * ✅ isReverso (opcional):
 * - Define el "modo" de render:
 *   - false -> anverso (default)
 *   - true  -> reverso
 *
 * ✅ loading:
 * - Controla el estado de carga visual (spinner).
 *
 * ✅ error (opcional):
 * - Si existe, se muestra un alert con error.
 *
 * ✅ processedImage (opcional):
 * - DataURL de la imagen que se envió al API para OCR.
 * - Sirve para que el usuario compare visualmente los resultados.
 *
 * ✅ imageComparison (opcional):
 * - Permite mostrar comparación:
 *   - originalImage: imagen original sin editar
 *   - processedImage: imagen enviada al API (puede estar editada)
 *   - confidence: porcentaje opcional si algún día tu API lo devuelve
 * ---------------------------------------------------------
 */
interface OCRResultsProps {
  data: INEData | ReversoData | null;
  isReverso?: boolean;
  loading: boolean;
  error?: string;
  processedImage?: string; // 🆕 Nueva prop para la imagen procesada
  imageComparison?: { // 🆕 Opcional: datos para comparación
    originalImage?: string;
    processedImage?: string;
    confidence?: number;
  };
  isMobile?: boolean; // 🆕 Nueva prop para responsividad desde App.tsx
}

/**
 * 📄 OCRResults
 * =========================================================
 * Componente "presentational":
 * - No llama APIs
 * - No modifica data
 * - Solo renderiza según props
 *
 * 🎨 Responsive:
 * - Usa theme breakpoints para ajustar alturas y mostrar/ocultar
 *   secciones informativas (ej. comparación en desktop).
 * =========================================================
 */
const OCRResults: React.FC<OCRResultsProps> = ({ 
  data, 
  isReverso = false, 
  loading, 
  error,
  processedImage,
  imageComparison,
  isMobile: propIsMobile
}) => {
  /**
   * 🎨 theme
   * - Se usa para breakpoints y estilos responsive.
   */
  const theme = useTheme();

  /**
   * 📱 isMobile (combinamos prop y media query)
   * - True si pantalla está en < md (normalmente móviles).
   */
  const mediaQueryIsMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = propIsMobile !== undefined ? propIsMobile : mediaQueryIsMobile;

  /**
   * 📟 isTablet
   * - True si pantalla está en < lg (tablets/mediano).
   */
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  /**
   * 📱 isSmallMobile
   * - True si pantalla está en < sm (móviles muy pequeños).
   */
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 📋 Copiar al portapapeles
  /**
   * 📋 copyToClipboard
   * ---------------------------------------------------------
   * Copia texto al portapapeles usando la API del navegador:
   * `navigator.clipboard.writeText(text)`
   *
   * ✅ Uso:
   * - En campos como CURP, Clave Elector, MRZ, etc.
   *
   * ⚠️ Nota UX:
   * - Aquí solo se hace `console.log`, pero podría agregarse toast/snackbar.
   *
   * @param text Texto a copiar
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Podrías agregar una notificación aquí si quieres
      console.log('Texto copiado:', text);
    });
  };

  /**
   * ⏳ Estado: LOADING
   * ---------------------------------------------------------
   * Cuando el OCR está procesando, se muestra spinner y texto.
   */
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: isMobile ? 2 : 4,
        minHeight: 300 
      }}>
        <CircularProgress size={isMobile ? 40 : 60} />
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ mt: 3, textAlign: 'center' }}>
          🔍 Procesando OCR...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
          Esto puede tomar unos segundos
        </Typography>
      </Box>
    );
  }

  /**
   * ❌ Estado: ERROR
   * ---------------------------------------------------------
   * Si viene `error`, se muestra un Alert rojo.
   */
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, mx: isMobile ? 0 : 'auto' }}>
        <ErrorIcon sx={{ mr: 1 }} />
        {error}
      </Alert>
    );
  }

  /**
   * 📝 Estado: SIN DATA
   * ---------------------------------------------------------
   * Se muestra un mensaje informativo si aún no hay resultados.
   */
  if (!data) {
    return (
      <Alert severity="info" sx={{ mt: 2, mx: isMobile ? 0 : 'auto' }}>
        📝 Los resultados aparecerán aquí después del procesamiento
      </Alert>
    );
  }

  /**
   * ✅ Render principal
   * =========================================================
   * Se compone de 3 grandes bloques:
   *
   * 1) 📊 Resultados del OCR (tablas/campos)
   * 2) 🖼️ Imagen procesada / comparación (opcional)
   * 3) 📋 Resumen del procesamiento (chips)
   * =========================================================
   */
  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* 📊 Resultados del OCR */}
      <Paper elevation={3} sx={{ 
        p: isMobile ? 2 : 3, 
        borderRadius: 2, 
        mt: 3,
        overflow: 'hidden'
      }}>
        {/* 🧾 Encabezado con estado + Chip anverso/reverso */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between', 
          mb: 3,
          gap: isMobile ? 1 : 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 0 }}>
            <CheckCircleIcon color="success" sx={{ 
              mr: 1, 
              fontSize: isMobile ? '1.5rem' : '2rem' 
            }} />
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
              ✅ Datos Extraídos {isReverso ? '(Reverso)' : '(Anverso)'}
            </Typography>
          </Box>
          <Chip
            label={isReverso ? '🔙 REVERSO' : '🪪 ANVERSO'}
            color={isReverso ? 'secondary' : 'primary'}
            sx={{ 
              ml: isMobile ? 0 : 2,
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              height: isMobile ? 28 : 32
            }}
          />
        </Box>

        {/**
         * 🔀 Render condicional por lado de la credencial:
         *
         * ✅ Reverso:
         * - Datos de nombre + MRZ (líneas)
         *
         * ✅ Anverso:
         * - Identificación (CURP, clave elector, sección)
         * - Personal (fecha nac, sexo, país)
         * - Domicilio (calle, colonia, estado)
         */}
        {isReverso ? (
          // 🔙 Datos del reverso
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                👤 Información Personal
              </Typography>
              <TableContainer sx={{ 
                maxHeight: isMobile ? 300 : 'none',
                overflow: 'auto'
              }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 120 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Apellido Paterno</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ 
                            wordBreak: 'break-word',
                            maxWidth: isMobile ? '150px' : 'none'
                          }}>
                            {(data as ReversoData).apellido_paterno}
                          </Typography>
                          <Tooltip title="Copiar">
                            <IconButton 
                              size={isMobile ? "small" : "medium"} 
                              onClick={() => copyToClipboard((data as ReversoData).apellido_paterno)}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopyIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 120 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Apellido Materno</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ 
                            wordBreak: 'break-word',
                            maxWidth: isMobile ? '150px' : 'none'
                          }}>
                            {(data as ReversoData).apellido_materno}
                          </Typography>
                          <Tooltip title="Copiar">
                            <IconButton 
                              size={isMobile ? "small" : "medium"} 
                              onClick={() => copyToClipboard((data as ReversoData).apellido_materno)}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopyIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 120 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Nombre(s)</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ 
                            wordBreak: 'break-word',
                            maxWidth: isMobile ? '150px' : 'none'
                          }}>
                            {(data as ReversoData).nombre_reverso}
                          </Typography>
                          <Tooltip title="Copiar">
                            <IconButton 
                              size={isMobile ? "small" : "medium"} 
                              onClick={() => copyToClipboard((data as ReversoData).nombre_reverso)}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopyIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 120 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Línea MRZ 1</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <code style={{ 
                            fontFamily: 'monospace', 
                            fontSize: isMobile ? '0.75rem' : '0.9rem',
                            wordBreak: 'break-all'
                          }}>
                            {(data as ReversoData).linea1}
                          </code>
                          <Tooltip title="Copiar">
                            <IconButton 
                              size={isMobile ? "small" : "medium"} 
                              onClick={() => copyToClipboard((data as ReversoData).linea1)}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopyIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 120 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Línea MRZ 2</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <code style={{ 
                            fontFamily: 'monospace', 
                            fontSize: isMobile ? '0.75rem' : '0.9rem',
                            wordBreak: 'break-all'
                          }}>
                            {(data as ReversoData).linea2}
                          </code>
                          <Tooltip title="Copiar">
                            <IconButton 
                              size={isMobile ? "small" : "medium"} 
                              onClick={() => copyToClipboard((data as ReversoData).linea2)}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopyIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        ) : (
          // 🪪 Datos del anverso
          <Grid container spacing={isMobile ? 2 : 3}>
            {/* 🆔 Identificación */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                🆔 Identificación
              </Typography>
              <TableContainer>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableBody>
                    {/* 📝 Nombre (nuevo campo) */}
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 100 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Nombre</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ 
                            wordBreak: 'break-word',
                            maxWidth: isMobile ? '150px' : 'none'
                          }}>
                            {(data as INEData).nombre}
                          </Typography>
                          <Tooltip title="Copiar nombre">
                            <IconButton 
                              size={isMobile ? "small" : "medium"} 
                              onClick={() => copyToClipboard((data as INEData).nombre)}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopyIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 100 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>CURP</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip 
                            label={(data as INEData).curp || 'No detectado'} 
                            color={(data as INEData).curp ? 'success' : 'error'}
                            size={isMobile ? "small" : "medium"}
                            sx={{ 
                              maxWidth: isMobile ? '180px' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          />
                          {(data as INEData).curp && (
                            <Tooltip title="Copiar CURP">
                              <IconButton 
                                size={isMobile ? "small" : "medium"} 
                                onClick={() => copyToClipboard((data as INEData).curp)}
                                sx={{ ml: 1 }}
                              >
                                <ContentCopyIcon fontSize={isMobile ? "small" : "medium"} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 100 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Clave Elector</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ 
                            wordBreak: 'break-word',
                            maxWidth: isMobile ? '150px' : 'none'
                          }}>
                            {(data as INEData).clave_elector}
                          </Typography>
                          <Tooltip title="Copiar">
                            <IconButton 
                              size={isMobile ? "small" : "medium"} 
                              onClick={() => copyToClipboard((data as INEData).clave_elector)}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopyIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 100 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Sección</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Typography variant="body2">
                          {(data as INEData).seccion}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* 👤 Información Personal */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                👤 Información Personal
              </Typography>
              <TableContainer>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 120 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Fecha Nacimiento</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        {(data as INEData).fecha_nacimiento}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 120 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>Sexo</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        <Chip 
                          label={(data as INEData).sexo || 'No especificado'} 
                          size={isMobile ? "small" : "medium"}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ 
                        minWidth: isMobile ? 120 : 150,
                        padding: isMobile ? '8px' : '16px'
                      }}>
                        <strong>País</strong>
                      </TableCell>
                      <TableCell sx={{ padding: isMobile ? '8px' : '16px' }}>
                        {(data as INEData).pais}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* 🏠 Domicilio */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                🏠 Domicilio
              </Typography>
              <Grid container spacing={isMobile ? 1 : 2}>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Calle
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        wordBreak: 'break-word',
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}>
                        {(data as INEData).calle}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Colonia
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        wordBreak: 'break-word',
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}>
                        {(data as INEData).colonia}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Estado
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        wordBreak: 'break-word',
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}>
                        {(data as INEData).estado}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* 🖼️ Sección de comparación de imagen */}
      {(processedImage || imageComparison?.processedImage) && (
        <Paper elevation={2} sx={{ 
          p: isMobile ? 2 : 3, 
          borderRadius: 2, 
          mt: 3,
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 3,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1 : 0
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 0 }}>
              <CompareIcon color="primary" sx={{ 
                mr: 1,
                fontSize: isMobile ? '1.25rem' : '1.5rem'
              }} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                🖼️ Imagen Procesada
              </Typography>
            </Box>
            <Tooltip title="Esta es la imagen que se envió al API para el procesamiento OCR">
              <ImageIcon sx={{ 
                ml: isMobile ? 0 : 2, 
                fontSize: isMobile ? 18 : 20, 
                color: 'text.secondary',
                alignSelf: isMobile ? 'flex-start' : 'center'
              }} />
            </Tooltip>
          </Box>

          <Grid container spacing={isMobile ? 1 : 3}>
            {/* 🖼️ Imagen procesada (siempre visible) */}
            <Grid item xs={12} md={imageComparison?.originalImage ? 6 : 12}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}>
                    <CheckCircleIcon color="success" sx={{ 
                      mr: 1, 
                      fontSize: isMobile ? 16 : 18 
                    }} />
                    Imagen Enviada al API
                  </Typography>
                  <Box
                    component="img"
                    src={processedImage || imageComparison?.processedImage}
                    alt="Imagen procesada por el API"
                    sx={{
                      width: '100%',
                      maxHeight: isSmallMobile ? 180 : isMobile ? 220 : 300,
                      borderRadius: 1,
                      border: '2px solid',
                      borderColor: 'success.main',
                      objectFit: 'contain',
                      backgroundColor: '#f5f5f5'
                    }}
                    onError={(e) => {
                      console.error('Error cargando imagen procesada');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    mt: 1, 
                    display: 'block',
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }}>
                    ✅ Esta imagen fue procesada por el sistema OCR
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* 🖼️ Imagen original (solo si está disponible para comparación) */}
            {imageComparison?.originalImage && (
              <>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: isMobile ? '0.875rem' : '1rem'
                      }}>
                        <ImageIcon color="info" sx={{ 
                          mr: 1, 
                          fontSize: isMobile ? 16 : 18 
                        }} />
                        Imagen Original
                      </Typography>
                      <Box
                        component="img"
                        src={imageComparison.originalImage}
                        alt="Imagen original"
                        sx={{
                          width: '100%',
                          maxHeight: isSmallMobile ? 180 : isMobile ? 220 : 300,
                          borderRadius: 1,
                          border: '2px solid',
                          borderColor: 'info.main',
                          objectFit: 'contain',
                          backgroundColor: '#f5f5f5'
                        }}
                        onError={(e) => {
                          console.error('Error cargando imagen original');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        mt: 1, 
                        display: 'block',
                        fontSize: isMobile ? '0.7rem' : '0.75rem'
                      }}>
                        📷 Imagen original antes de cualquier procesamiento
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 📊 Información de comparación */}
                <Grid item xs={12}>
                  <Divider sx={{ my: isMobile ? 1 : 2 }} />
                  <Alert severity="info" sx={{ mt: isMobile ? 1 : 2 }}>
                    <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                      <strong>🔍 Comparación:</strong> La imagen de la izquierda fue la enviada al API después de 
                      {imageComparison.confidence ? ` (confianza: ${imageComparison.confidence}%)` : ''} 
                      cualquier edición realizada. Compara los datos extraídos con lo que ves en la imagen.
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}
          </Grid>

          {/* 💡 Nota informativa */}
          {!imageComparison?.originalImage && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                <strong>💡 Nota:</strong> Esta es la imagen exacta que se procesó mediante OCR. 
                Verifica que la información extraída coincida con lo visible en la imagen.
              </Typography>
            </Alert>
          )}
        </Paper>
      )}

      {/* 📋 Resumen del procesamiento */}
      <Paper variant="outlined" sx={{ 
        p: isMobile ? 1.5 : 2, 
        borderRadius: 2, 
        mt: 3, 
        bgcolor: 'grey.50',
        overflow: 'hidden'
      }}>
        <Grid container spacing={isMobile ? 1 : 2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom sx={{ 
              fontWeight: 'bold',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
              📊 Resumen del Procesamiento
            </Typography>
            <Stack direction="row" spacing={isMobile ? 1 : 2} flexWrap="wrap" useFlexGap>
              <Chip 
                label={`${isReverso ? 'Reverso' : 'Anverso'} procesado`} 
                color="primary" 
                size={isMobile ? "small" : "medium"}
                sx={{ mb: isMobile ? 0.5 : 0 }}
              />
              <Chip 
                label={Object.keys(data).length + " campos extraídos"} 
                color="success" 
                size={isMobile ? "small" : "medium"}
                sx={{ mb: isMobile ? 0.5 : 0 }}
              />
              {processedImage && (
                <Chip 
                  label="Imagen disponible" 
                  color="info" 
                  size={isMobile ? "small" : "medium"}
                  icon={<ImageIcon fontSize={isMobile ? "small" : "medium"} />}
                  sx={{ mb: isMobile ? 0.5 : 0 }}
                />
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" sx={{ 
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              mt: isMobile ? 1 : 0
            }}>
              ✅ El OCR se completó exitosamente. Verifica que todos los datos coincidan con la imagen.
              {processedImage && " Puedes comparar los resultados con la imagen procesada arriba."}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default OCRResults;