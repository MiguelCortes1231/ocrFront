/**
 * 🛡️ ProtectedRoute.tsx
 * =========================================================
 * 🎯 Componente de ruta protegida (HOC - Higher Order Component)
 *
 * Este componente:
 * - ✅ Protege rutas que requieren autenticación
 * - 🔐 Verifica si hay sesión activa
 * - 🔄 Redirige a login si no hay sesión
 * - ⏳ Muestra loading mientras verifica
 * - 🧠 Se integra con React Router
 *
 * 🎯 Uso:
 * <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
 *
 * 📘 Estilo de documentación:
 * - AngularDoc/JSDoc + emojis 😄
 * =========================================================
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { authService } from '../services/api';

/**
 * 🧩 ProtectedRouteProps
 * ---------------------------------------------------------
 * Props del componente ProtectedRoute.
 *
 * ✅ children:
 * - Componente hijo que se renderizará si la sesión es válida
 * ---------------------------------------------------------
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 🛡️ ProtectedRoute
 * =========================================================
 * Higher Order Component que protege rutas.
 * 
 * 🔁 Flujo:
 * 1. Mostrar loading mientras verifica
 * 2. Verificar sesión con `authService.isSessionActive()`
 * 3. Si hay sesión → renderizar children
 * 4. Si no hay sesión → redirigir a /login
 * =========================================================
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // ⏳ Estado de verificación
  const [isVerifying, setIsVerifying] = useState(true);
  
  // ✅ Estado de sesión
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('🔍 Verificando autenticación para ruta protegida...');
    
    const verifyAuth = async () => {
      try {
        // 🔍 Verificar si hay token y no ha expirado
        if (authService.isSessionActive()) {
          console.log('✅ Sesión activa encontrada');
          setIsAuthenticated(true);
        } else {
          console.log('🔐 Sesión expirada o no existe');
          
          // 🧹 Limpiar tokens expirados
          authService.logout();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Error verificando autenticación:', error);
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, []);

  // ⏳ Mientras verifica, mostrar loading
  if (isVerifying) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default'
      }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          🔍 Verificando sesión...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Por favor, espera un momento
        </Typography>
      </Box>
    );
  }

  // 🔄 Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    console.log('🔄 Redirigiendo a login...');
    return <Navigate to="/login" replace />;
  }

  // ✅ Renderizar children si está autenticado
  return <>{children}</>;
};

export default ProtectedRoute;