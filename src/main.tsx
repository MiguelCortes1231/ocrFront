/**
 * 🏁 main.tsx
 * =========================================================
 * 🎯 Punto de entrada (entrypoint) de la aplicación React.
 *
 * Este archivo:
 * - ⚛️ Monta la app en el DOM usando React 18+ (`createRoot`)
 * - 🎨 Define e inyecta un tema global de Material UI (MUI)
 * - 🧼 Aplica un reset/base CSS con `CssBaseline`
 * - 🧩 Renderiza el componente raíz: `<App />`
 *
 * ✅ Estilo de documentación: AngularDoc/JSDoc + emojis 😄
 * ⚠️ Nota importante:
 * - No se modifica la lógica del código.
 * - No se eliminan ni alteran comentarios existentes.
 * =========================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

/**
 * 🎨 Tema global de MUI
 * ---------------------------------------------------------
 * Aquí definimos el diseño visual general de toda la app:
 *
 * 🖌️ `palette`:
 * - `primary`: color principal (botones, highlights, etc.)
 * - `secondary`: color secundario (acciones alternas)
 * - `background`: fondos por defecto del layout
 *
 * 🔤 `typography`:
 * - Fuente base de la aplicación (stack compatible multiplataforma)
 *
 * 🔲 `shape`:
 * - `borderRadius` general (redondeo de componentes)
 *
 * 🧩 `components`:
 * - Overrides globales para componentes de MUI
 *   - `MuiButton`: evita uppercase automático y refuerza el peso
 *   - `MuiPaper`: shadow suave para tarjetas/paneles
 *
 * 💡 Tip:
 * - Centralizar el tema aquí permite que cualquier componente use
 *   `theme.palette`, `theme.typography`, etc. para ser consistente.
 * ---------------------------------------------------------
 */
// 🎨 Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

/**
 * 🧱 Montaje de la aplicación en el DOM
 * ---------------------------------------------------------
 * 1) `document.getElementById('root')!`
 *    - 📌 Obtiene el contenedor principal del HTML (normalmente en `index.html`)
 *    - `!` (non-null assertion) indica a TypeScript que este elemento existe
 *
 * 2) `ReactDOM.createRoot(...)`
 *    - ⚡ Activa el modo concurrente de React (React 18+)
 *
 * 3) `<React.StrictMode>`
 *    - 🧪 Modo estricto en desarrollo
 *    - Ayuda a detectar efectos secundarios, renders inesperados, etc.
 *    - (En dev puede "doble-renderizar" algunos efectos para ayudarte)
 *
 * 4) `<ThemeProvider theme={theme}>`
 *    - 🎨 Inyecta el tema a toda la app
 *    - Permite usar `useTheme()` en componentes y estilos coherentes
 *
 * 5) `<CssBaseline />`
 *    - 🧼 Normaliza estilos base (reset moderno)
 *    - Mejora consistencia visual entre navegadores
 *
 * 6) `<App />`
 *    - 🚀 Tu aplicación real: wizard, editor, cámara, OCR, etc.
 * ---------------------------------------------------------
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
