# Ghost prISM - Estación de Operación Alfa

Dashboard web y Progressive Web App (PWA) para el control, monitoreo y seguimiento en tiempo real de situaciones de riesgo y emergencias. Desarrollado como la terminal de operación central "Madre" para el sistema de seguridad mundial (Ghost Prism).

## 🚀 Características Principales

*   **Autenticación Segura**: Acceso restringido para operadores de la estación (Sentinel) validando CURP y contraseña con encriptación hash SHA-256.
*   **Panel de Control (Dashboard)**: Visualización rápida de las métricas clave y las últimas alertas de incidencias activas.
*   **Mapa en Tiempo Real**: Integración nativa con **Leaflet.js** y OpenStreetMap para ubicar las activaciones de los botones de pánico y trazar geolocalizaciones de los dispositivos en un entorno geográfico real.
*   **Historial Completo**: Registro detallado de todos los eventos (alertas de pánico, desconexiones, etc.) mostrando fecha de la alerta, dispositivo involucrado, ubicación GPS aproximada y su estado actual de resolución.
*   **Soporte PWA (Progressive Web App)**: Funciona como una aplicación instalable de forma nativa en dispositivos móviles y de escritorio gracias a su `manifest.json` y el Service Worker encargado del ciclo de vida web.
*   **Conectividad Ligera sin SDKs**: Conexión nativa directa y optimizada a Supabase usando la API REST mediante `fetch()`, garantizando alto rendimiento y sin dependencias de Node.js pesadas en el frontend.

## 🛠️ Stack y Tecnologías

*   **Frontend**: HTML5 Semántico, Vanilla JavaScript (ESM) y Vanilla CSS (Dark-Theme).
*   **Mapas**: Leaflet.js (v1.9.4).
*   **Criptografía**: CryptoJS (para comparativa algorítmica SHA-256 de contraseñas de sesión).
*   **Base de Datos y Backend**: API de Supabase (PostgreSQL), utilizando reglas de Row-Level Security (RLS).

## 📂 Arquitectura de Archivos

```text
/home/rstr/appsMovilesv2/
├── index.html        # Punto de entrada de la SPA/PWA y carga de importaciones base.
├── manifest.json     # Metadatos de la PWA (iconos, paleta de color, orientación global).
├── sw.js             # Service Worker para funcionalidades web nativas y manejo offline.
├── css/
│   └── style.css     # Hoja de estilos principal con variables y estructuración grid/flex.
├── assets/           # Imágenes y recursos estáticos.
└── js/
    ├── main.js       # Orquestador: Manejo de estado de la UI (vistas de login y sistema) de forma reactiva simple.
    ├── auth.js       # Autenticación, validación estricta de regex CURP, y gestión de sesión en localStorage.
    ├── dashboard.js  # Renderizado dinámico del panel general y las alertas del sistema.
    ├── map.js        # Configuración e instanciación de mapas y capas en Leaflet.
    └── supabase.js   # Wrapper de Base de Datos para operaciones Create/Read/Update empleando fetch puro.
```

## 🔧 Configuración y Puesta en Marcha (Desarrollo)

El proyecto está diseñado de forma modular y sin herramientas complejas de _bundling_, por lo que su ejecución local es extremadamente simple:

1.  **Ejecutar Servidor Local**: Puedes montar un servidor HTTP embebido o usar la extensión "Live Server" de tu IDE.

3.  **Ambientes de Base de Datos**:
    Las credenciales de Supabase están referenciadas en `js/supabase.js` y `js/auth.js`. 
    ```javascript
    const SUPABASE_URL = 'SUPABASE_URL';
    const SUPABASE_ANON_KEY = 'PUBLISHABLE_ANONKEY';
    ```
4.  Abre [http://localhost:8000](http://localhost:8000) en tu navegador preferido.

## 🔑 Estructura de Tabla Requerida (Supabase)

Para el total funcionamiento del frontend con las consultas del backend, se requieren las siguientes tablas en PostgreSQL:

*   **`usuarios`**: Para control de operadores; columnas `curp`, `nombre`, `rol`, `password_hash`.
*   **`dispositivos`**: Identificadores de módulos/hardware a rastrear; columnas `mac`, `propietario`, `status`, `lat`, `lng`, `ultima_conexion`.
*   **`incidencias`**: Alertas generadas; columnas `id`, `tipo` ('panic', 'disconnected'), `status` ('activa', 'resuelta'), `lat`, `lng`, `notas`, `created_at`.
*   **`historial`**: Log maestro para auditoría de acciones; columnas `id`, `dispositivo_id`, `usuario_id`, `accion`, `detalle`, `created_at`.

**(Nota: Cerciorarse de que las directivas RLS en Supabase estén habilitadas y admitan Inserts/Selects según los requerimientos operativos previstos.)**
