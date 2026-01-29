## ✨ Autor

👨‍💻 **Castillo Olivera Ricardo Orlando**  
🚀 Desarrollador de Software  
🇲🇽 México


# 🪪 INE/IFE OCR Scanner (Frontend) — React + Vite + MUI

Este proyecto es el **frontend** del sistema de OCR para credenciales **INE/IFE**.  
Permite **subir o capturar** una foto, **editarla (recorte/rotación)**, **previsualizar** y finalmente **enviarla al backend** para extraer datos del **anverso** o del **reverso (MRZ)**.

---

## ✨ Funciones principales

### 🧭 Flujo por pasos (Wizard)
El flujo está diseñado como un proceso guiado:

1. **📸 Capturar / Subir imagen**
   - Subida de archivo (drag & drop o selector)
   - Captura desde cámara (webcam)
2. **✂️ Editar imagen**
   - Recorte con proporción de credencial (ID card)
   - Rotación (izquierda/derecha) + “Aplicar rotación”
   - Historial: **deshacer / rehacer**
   - Reset total a la imagen original
3. **👁️ Previsualizar**
   - Cambiar entre **Original** / **Editada** / (opcional) **Mejorada por IA**
   - Preparar la versión exacta que se enviará al OCR
4. **🔍 Procesar OCR**
   - Modo **🪪 Anverso** (`/ocr`)
   - Modo **🔙 Reverso** (`/ocrreverso`)
   - Muestra resultados y **la imagen enviada al API** (comparación visual)

---

## 🧩 Tecnologías usadas

- ⚡ **Vite** (dev server / build)
- ⚛️ **React 19 + TypeScript**
- 🎨 **Material UI (MUI)** (layout, stepper, dialogs, alerts, etc.)
- 📡 **Axios** (consumo del backend OCR)
- 📸 **react-webcam** (captura de cámara)
- ✂️ **react-image-crop** (recorte)
- 🍞 **react-toastify** (notificaciones)

Dependencias claves del proyecto: ver `package.json`.

---

## 🔗 Backend requerido (OCR API)

Este frontend **necesita** el backend corriendo (por defecto):

- 🌐 **Base URL**: `http://localhost:5001`
- 📮 Endpoints usados:
  - `POST /ocr` → Anverso (JSON)
  - `POST /ocrreverso` → Reverso MRZ (JSON)
  - `POST /enhance` → Mejora de imagen (PNG/Blob) *(opcional, el UI ya lo contempla)*

> ✅ Importante: el backend debe tener **CORS habilitado** para que el navegador permita las llamadas.

---

## ⚙️ Variables de entorno

Puedes configurar la URL del backend con:

- `VITE_API_URL`

### ✅ Ejemplo `.env`
Crea un archivo **`.env`** en la raíz del frontend:

```bash
VITE_API_URL=http://localhost:5001
```

Si no defines nada, el frontend usa:
- `http://localhost:5001`

*(Esto está definido en el servicio de API.)* ✅

---

## 🚀 Cómo correr el proyecto (Dev)

### 1) Requisitos
- ✅ Node.js 18+ (recomendado 20+)
- ✅ npm / pnpm / yarn (aquí usamos npm en ejemplos)
- ✅ Backend OCR corriendo (ver sección anterior)

### 2) Instalar dependencias
```bash
npm install
```

### 3) Levantar en modo desarrollo
```bash
npm run dev
```

Vite te mostrará una URL como:
- `http://localhost:5173`

---

## 🏗️ Build de producción

```bash
npm run build
```

Y para probar el build localmente:

```bash
npm run preview
```

---

## 🧠 Cómo funciona la integración con el backend

### 📡 Servicio de API (Axios)
El frontend envía imágenes como `multipart/form-data` con el campo:

- **`imagen`** (File)

Rutas (según el modo):
- 🪪 Anverso → `/ocr`
- 🔙 Reverso → `/ocrreverso`

También existe:
- ✨ Enhance → `/enhance` con `responseType: "blob"` (para recibir PNG)

> Tip: si el backend corre en otro host/puerto, usa `VITE_API_URL`.

---

## 🪪 Modo Anverso vs 🔙 Modo Reverso

En la barra superior hay un botón para alternar:

- 🪪 **Anverso**: extrae CURP, clave elector, vigencia, domicilio, etc.
- 🔙 **Reverso**: intenta detectar y leer la zona **MRZ** (líneas con `IDMEX...`)

---

## 📁 Estructura (alto nivel)

> Nota: el proyecto puede tener más archivos/carpetas, aquí se listan los más relevantes:

- `src/App.tsx` 🧠  
  Orquesta todo: wizard, estados globales, selección de imagen, enhance y OCR.
- `src/services/api.ts` 📡  
  Servicio `ocrService` con `processAnverso`, `processReverso`, `enhanceImage`.
- `src/components/`
  - `ImageUploader` 📤 (drag/drop + archivo + cámara)
  - `CameraCapture` 📸 (Webcam)
  - `ImageEditor` ✂️ (Crop + rotate + historial)
  - `PreviewPanel` 👁️ (selección Original/Editada/Mejorada)
  - `OCRResults` ✅ (UI de resultados + comparación de imagen)
- `src/types/` (interfaces TypeScript) 📋

---

## 🧪 Tips para mejores resultados de OCR

- 💡 **Iluminación**: evita sombras/reflejos
- 🎯 **Enfoque**: texto nítido
- 📐 **Ángulo**: lo más recto posible (sin perspectiva)
- ✂️ **Recorte**: recorta solo la credencial (menos “ruido” = mejor OCR)
- 🧼 **Fondo**: contrastante (mesa oscura o blanca)

---

## 🧯 Troubleshooting (errores comunes)

### ❌ CORS / Network Error en el navegador
✅ Solución:
- Asegúrate de tener el backend levantado
- Verifica que acepte CORS
- Revisa `VITE_API_URL`

### ❌ 404 en `/ocr` o `/ocrreverso`
✅ Solución:
- Confirma que el backend expone exactamente esas rutas
- Revisa el puerto (`5001`) y la URL

### ❌ La cámara no abre
✅ Solución:
- En Chrome/Edge: permite permisos de cámara
- Usa HTTPS en producción (en localhost suele funcionar)

### ❌ OCR devuelve datos vacíos
✅ Solución:
- Prueba recortar mejor la credencial
- Endereza/rota antes de procesar
- Intenta una foto con más luz

---

## ✅ Checklist rápido para que funcione

- [ ] Backend OCR corriendo en `http://localhost:5001`
- [ ] CORS habilitado en backend
- [ ] (Opcional) `.env` con `VITE_API_URL`
- [ ] `npm install`
- [ ] `npm run dev`
- [ ] Subir/capturar imagen → editar → previsualizar → OCR

---

## 🧾 Licencia
Proyecto privado / uso interno (ajústalo si vas a publicarlo).
