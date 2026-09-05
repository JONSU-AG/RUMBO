# 🚀 RUMBO - Plataforma Preuniversitaria Gratuita & Colaborativa

[![Descargar RUMBO APK](https://img.shields.io/badge/📱_Descargar_App_Android-APK_Instalable-success?style=for-the-badge&logo=android&logoColor=white)](https://github.com/JONSU-AG/RUMBO/actions/workflows/build-apk.yml)
[![PWA Web App](https://img.shields.io/badge/🌐_Web_App-Instalable_PWA-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://rumbo.vercel.app)

![RUMBO Banner](public/assets/LOGOR.png)

> **RUMBO** es una plataforma web moderna, interactiva y de acceso libre diseñada para acompañar y potenciar la preparación académica de postulantes preuniversitarios (UNSA, UNMSM, UNI y más), centralizando materiales de estudio, apuntes comunitarios, simuladores de exámenes y una red de aliados académicos.

---

### 📱 **Descargar Aplicación para Android (APK)**
- 📲 **[Haz clic aquí para ir directamente a la última APK compilada](https://github.com/JONSU-AG/RUMBO/actions/workflows/build-apk.yml)**
- ⚡ **Compilación automática:** Cada actualización genera automáticamente un archivo `app-debug.apk` actualizado y listo para instalar en cualquier smartphone.

---

## 🌟 Características Principales

### 📚 1. Banco de Materiales & Cursos Académicos
- Acceso a carpetas organizadas por áreas: Ingenierías, Biomédicas, Sociales y Humanidades.
- Material clasificado por academias, ciclos y semanas de estudio.
- Visualizador inteligente de enlaces (Google Drive, PDFs y videos).

### 🎯 2. Simulador de Exámenes de Admisión
- Pruebas tipo admisión con temporizador real.
- Cálculo automático de puntaje, aciertos, errores y respuestas en blanco.
- Historial y retroalimentación inmediata.

### 🎴 3. Carrusel & Red de Aliados Oficiales
- Espacio dedicado para postulantes destacados, creadores de contenido, docentes y academias.
- **Requisito para ser Aliado:** Compartir al menos **10 aportes** a la comunidad y difundir RUMBO en redes sociales (TikTok / WhatsApp).
- Carrusel responsivo dinámico (rotación continua horizontal en celular y PC).

### 📤 4. Subida Colaborativa de Material
- Formulario intuitivo para que la comunidad envíe aportes con enlaces de Google Drive.
- Conteo automático de aportes por usuario registrado.

### ❤️ 5. Sistema de Reacciones en Tiempo Real
- Reacciones interactivas persistentes con soporte offline y sincronización en la nube (Firebase Firestore).

### 👑 6. Panel de Administración (Moderación)
- Gestión y moderación en vivo de solicitudes de aliados.
- Aprobación o rechazo de material subido por la comunidad.
- Editor rápido de tarjetas y asignación de rangos/medallas.

### 📱 7. Diseño iOS Liquid Glassmorphism
- Interfaz moderna, minimalista y ultra fluida adaptada a cualquier pantalla (móvil, tablet y escritorio).
- Soporte para Tema Claro y Tema Oscuro.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | [React 18](https://react.dev/), [Vite](https://vitejs.dev/), JavaScript (ESM) |
| **Animaciones** | [Framer Motion](https://www.framer.com/motion/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Iconografía** | [Lucide React](https://lucide.dev/) |
| **Estilos** | CSS Moderno & Glassmorphism (`src/styles/ios-glass.css`) |
| **Backend / Base de Datos** | [Google Firebase](https://firebase.google.com/) (Auth, Cloud Firestore) |
| **Enrutamiento** | [React Router DOM v6](https://reactrouter.com/) |

---

## 📁 Estructura del Proyecto

```text
RUMBO1-main/
├── public/
│   ├── assets/              # Logotipos, insignias y recursos estáticos
│   └── favicon.ico
├── src/
│   ├── components/          # Componentes reutilizables (AliadosCarousel, Navbar, etc.)
│   ├── context/             # Contextos globales (AuthContext, ThemeContext)
│   ├── data/                # Datos base y estructura académica
│   ├── lib/                 # Inicialización de Firebase
│   ├── pages/               # Vistas principales (Home, Cursos, Simulador, Admin, etc.)
│   ├── styles/              # Hojas de estilo globales y sistema de diseño iOS Glass
│   ├── App.jsx              # Enrutador principal de la aplicación
│   └── main.jsx             # Punto de entrada de React
├── .env                     # Variables de entorno de Firebase
├── package.json             # Dependencias y scripts
└── vite.config.js           # Configuración del empaquetador Vite
```

---

## ⚙️ Instalación y Puesta en Marcha

### 1. Clonar o descargar el repositorio
```bash
git clone <url-del-repositorio>
cd RUMBO1-main
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno (`.env`)
Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abre en tu navegador: `http://localhost:5173`

### 5. Compilar para Producción
```bash
npm run build
```

---

## 🔒 Reglas de Moderación y Derechos

- Todo el material compartido en la plataforma es de **libre acceso educativo**.
- Queda **estrictamente prohibido lucrar o comercializar** con el contenido recopilado.
- Los derechos de autor corresponden a sus respectivos docentes, academias e instituciones.

---

## 👨‍💻 Creador & Fundador

- **Creador:** *Tu Buen Amigo Jonsu (Futuro Cachimbo)* 👑
- **Proyecto:** RUMBO - Educación Preuniversitaria Libre
- **WhatsApp Oficial:** [Canal de WhatsApp RUMBO](https://www.whatsapp.com/channel/0029VbDFAEu7YScyVZBNul0X)
- **TikTok Oficial:** [@futurocachimbounsa](https://www.tiktok.com/@futurocachimbounsa)
