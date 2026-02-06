/**
 * 🔐 Login.tsx
 * =========================================================
 * 🎯 Componente de autenticación para la aplicación INE OCR
 *
 * Este componente:
 * - ✅ Muestra formulario de login (usuario/contraseña)
 * - 🔐 Se comunica con backend para autenticar
 * - 💾 Guarda tokens JWT y Laravel en localStorage
 * - 🔄 Redirige a la app principal si ya hay sesión activa
 * - 📱 Es completamente responsive
 * - 🎨 Tiene diseño acorde al resto de la aplicación
 *
 * 🧠 Integración:
 * - Usa `authService.login()` del api.ts
 * - Maneja errores específicos (credenciales incorrectas, conexión, etc.)
 * - Redirige a `/` (App principal) al autenticar exitosamente
 *
 * 📘 Estilo de documentación:
 * - AngularDoc/JSDoc + emojis 😄
 * =========================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Container,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  Login as LoginIcon,
  Security
} from '@mui/icons-material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 📦 Servicios
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * 🔐 Login
 * =========================================================
 * Componente funcional de autenticación.
 * 
 * 🔁 Flujo:
 * 1. Verificar si ya hay sesión activa → redirigir
 * 2. Mostrar formulario de login
 * 3. Procesar submit → authService.login()
 * 4. Manejar éxito/error
 * 5. Redirigir a app principal
 * =========================================================
 */
const Login: React.FC = () => {
  // 🎨 Hook de tema y media queries para responsividad
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // 🧭 Navegación
  const navigate = useNavigate();

  // 📝 Estados del formulario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // 👁️ Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  
  // ⏳ Estado de carga
  const [loading, setLoading] = useState(false);
  
  // ❌ Estado de error
  const [error, setError] = useState('');

  // 🔍 Verificar sesión al cargar el componente
  useEffect(() => {
    console.log('🔍 Verificando sesión activa...');
    
    if (authService.isSessionActive()) {
      console.log('✅ Sesión activa encontrada, redirigiendo a app principal');
      navigate('/');
    } else {
      console.log('🔐 No hay sesión activa, mostrando formulario de login');
      
      // 🧹 Limpiar tokens expirados si existen
      authService.logout();
    }
  }, [navigate]);

  // 📝 Manejar cambio en inputs
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError(''); // Limpiar error al editar
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(''); // Limpiar error al editar
  };

  // 👁️ Alternar visibilidad de contraseña
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // 🚀 Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Validaciones básicas
    if (!username.trim() || !password.trim()) {
      setError('❌ Por favor, completa todos los campos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    console.log('🚀 Intentando login con:', { username });
    
    try {
      // 🔐 Llamar al servicio de autenticación
      const response = await authService.login(username, password);
      
      console.log('✅ Login exitoso:', {
        user: response.user,
        tokenLength: response.token?.length,
        laravelTokenLength: response.token_laravel?.length
      });
      
      // 🎉 Mostrar mensaje de éxito
      toast.success('✅ ¡Autenticación exitosa!');
      
      // ⏳ Pequeño delay para que se vea el toast
      setTimeout(() => {
        // 🔄 Redirigir a la app principal
        navigate('/');
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      
      // 🎯 Manejo específico de errores
      if (error.message.includes('incorrectos')) {
        setError('❌ Usuario o contraseña incorrectos');
        toast.error('❌ Credenciales incorrectas');
      } else if (error.message.includes('conexión')) {
        setError('🔌 Error de conexión. Verifica tu internet.');
        toast.error('🔌 Error de conexión');
      } else {
        setError(`⚠️ ${error.message}`);
        toast.error(`⚠️ ${error.message}`);
      }
      
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🎨 Render del componente
   * =========================================================
   * Layout responsive con:
   * - Encabezado con logo/título
   * - Formulario centrado
   * - Campos con iconos
   * - Botón de submit con estado loading
   * - Alert para errores
   * - Información de ayuda
   * =========================================================
   */
  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      p: isMobile ? 2 : 3
    }}>
      <Container maxWidth="sm">
        {/* 🖼️ Tarjeta de login */}
        <Paper elevation={6} sx={{
          p: isMobile ? 3 : 4,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          
          {/* 🏷️ Encabezado */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Security sx={{
              fontSize: isMobile ? 48 : 60,
              color: 'primary.main',
              mb: 2
            }} />
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ fontWeight: 'bold' }}>
              🔐 INE Scanner
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sistema de reconocimiento de credenciales INE/IFE
            </Typography>
          </Box>
          
          {/* 📝 Formulario de login */}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* 👤 Campo de usuario */}
              <TextField
                label="Usuario"
                variant="outlined"
                fullWidth
                value={username}
                onChange={handleUsernameChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
              />
              
              {/* 🔐 Campo de contraseña */}
              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                value={password}
                onChange={handlePasswordChange}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        size={isMobile ? "small" : "medium"}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
              />
              
              {/* ❌ Mensaje de error */}
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }
                  }}
                >
                  {error}
                </Alert>
              )}
              
              {/* 🚀 Botón de login */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading || !username || !password}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                fullWidth
                sx={{
                  py: isMobile ? 1.5 : 2,
                  borderRadius: 2,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                {loading ? 'Autenticando...' : 'Iniciar Sesión'}
              </Button>
            </Box>
          </form>
          
          {/* 💡 Información de ayuda */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="body2" color="text.secondary" align="center">
              💡 <strong>Información importante:</strong>
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mt: 1,
              '& li': {
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                mb: 0.5
              }
            }}>
              <Typography component="li" variant="body2" color="text.secondary">
                La sesión tiene una duración de <strong>100 minutos</strong>
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Se requiere conexión a internet para autenticación
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Usa las credenciales proporcionadas por el administrador
              </Typography>
            </Box>
          </Box>
          
          {/* 🔒 Información de seguridad */}
          <Alert 
            severity="info" 
            sx={{ 
              mt: 3, 
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }
            }}
          >
            <Typography variant="body2">
              🔒 <strong>Seguridad:</strong> Los tokens se almacenan localmente y se envían
              automáticamente en cada petición al servidor OCR.
            </Typography>
          </Alert>
        </Paper>
        
        {/* 📱 Versión responsive del footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="white" sx={{ 
            fontSize: isMobile ? '0.7rem' : '0.875rem',
            opacity: 0.9
          }}>
            © {new Date().getFullYear()} INE Scanner - Sistema de OCR para credenciales INE/IFE
          </Typography>
        </Box>
      </Container>
      
      {/* 🍞 Notificaciones Toast */}
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

export default Login;