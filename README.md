# Ciclexespress: Taller de reparación de bicicletas y patinetas eléctricas

Este proyecto corresponde a una aplicación web desarrollada con Node.js, Express y TypeScript, cuyo objetivo es gestionar formularios de contacto, simular un proceso de pago, enviar confirmaciones por correo electrónico a los usuarios y notificaciones internas al administrador, y permitir la administración segura mediante autenticación local y con Google.

## Características

- Formulario de contacto con validación y protección mediante reCAPTCHA.
- Envío automático de correo de confirmación al usuario tras un contacto exitoso.
- Notificación por correo electrónico al administrador/profesor sobre nuevos contactos.
- Simulación de proceso de pago a través de una API externa.
- Envío de correo de confirmación de pago al usuario.
- Base de datos SQLite para la persistencia de datos (contactos, mensajes, usuarios y pagos).
- Manejo de variables de entorno para una configuración segura.
- Implementación en TypeScript para mayor robustez y mantenibilidad.
- **Autenticación local** (usuario/contraseña con bcrypt y sesiones).
- **Autenticación con Google OAuth2** (inicio de sesión con cuenta de Google).
- **Vistas protegidas** para administración de contactos y pagos.
- **Filtros y buscadores** en las tablas de contactos y pagos (por nombre, email, estado, fecha, etc.).
- **Metadatos Open Graph** dinámicos para mejor integración en redes sociales.
- **Gestión segura de sesiones** (cookies seguras, expiración por inactividad).
- **Mensajes flash** para notificaciones de éxito/error en la interfaz.

## Tecnologías Utilizadas

**Backend:**
- [Node.js](https://nodejs.org/): Entorno de ejecución.
- [Express.js](https://expressjs.com/): Framework web para Node.js.
- [TypeScript](https://www.typescriptlang.org/): Lenguaje de programación.
- [SQLite](https://www.sqlite.org/): Base de datos relacional ligera.
- [Nodemailer](https://nodemailer.com/): Envío de correos electrónicos.
- [dotenv](https://www.npmjs.com/package/dotenv): Carga de variables de entorno.
- [node-fetch](https://www.npmjs.com/package/node-fetch): Solicitudes HTTP a la API de pago.
- [connect-flash](https://www.npmjs.com/package/connect-flash): Mensajes flash temporales.
- [express-session](https://www.npmjs.com/package/express-session): Gestión de sesiones.
- [bcrypt](https://www.npmjs.com/package/bcrypt): Hash de contraseñas.
- [passport](https://www.npmjs.com/package/passport): Autenticación.
- [passport-local](https://www.npmjs.com/package/passport-local): Estrategia local para Passport.
- [passport-google-oauth20](https://www.npmjs.com/package/passport-google-oauth20): Estrategia Google OAuth2 para Passport.
- [ejs](https://www.npmjs.com/package/ejs): Motor de plantillas para Express.

**Frontend:**
- [Bootstrap](https://getbootstrap.com/): Framework CSS.
- [Bootstrap Icons](https://icons.getbootstrap.com/): Íconos vectoriales.
- JavaScript para filtros/buscadores en tablas.

**Herramientas de Desarrollo:**
- [npm](https://www.npmjs.com/): Gestor de paquetes.
- [TSC (TypeScript Compiler)](https://www.typescriptlang.org/): Compilador de TypeScript.

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido (ajusta los valores según tu entorno):

```env
# Puerto donde corre la app
PORT=3000

# Clave secreta para sesiones (usa una cadena larga y aleatoria)
SESSION_SECRET=tu_secreto_aleatorio_para_sesiones

# Configuración de Base de Datos
DB_PATH=./data/app.db

# Claves de Google reCAPTCHA
RECAPTCHA_SECRET_KEY=tu_clave_secreta_recaptcha
RECAPTCHA_SITE_KEY=tu_clave_site_recaptcha

# Configuración SMTP para envío de correos
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_gmail # Usa una App Password de Google
EMAIL_NAME=CICLEXPRESS
TEACHER_EMAIL=correo.del.profe@example.com

# API de geolocalización por IP
GEOLOCATION_API_URL=http://ip-api.com/json/

# Google Analytics (ID de medición)
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# API Key para pagos simulados
FAKE_PAYMENT_API_KEY=tu_clave_api_fake_payment_jwt

# Google OAuth2
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
```

**Notas:**
- Para `EMAIL_PASS` en Gmail, debes generar una "Contraseña de Aplicación" en la configuración de seguridad de tu cuenta de Google.
- Cambia `GOOGLE_CALLBACK_URL` si despliegas en producción.

## Instalación

### Prerrequisitos

- [Node.js](https://nodejs.org/en/download/) (se recomienda la versión LTS).
- [npm](https://docs.npmjs.com/cli/v9/commands/npm) (incluido con Node.js).

### Pasos de Instalación

1. **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Heshmert/P2_31499269.git
    cd task-0
    ```

2. **Instalar las dependencias:**
    ```bash
    npm install
    ```

3. **Configurar las variables de entorno:**
    - Crea un archivo llamado `.env` en la raíz del proyecto.
    - Copia el contenido de ejemplo anterior y reemplaza los valores por los correspondientes.

4. **Compilar TypeScript (opcional si usas `npm run dev`):**
    ```bash
    npm run build
    ```

## Uso

### Iniciar la Aplicación

Una vez instaladas las dependencias y configuradas las variables de entorno, inicia el servidor con:

```bash
npm run dev
```

o en producción:

```bash
npm start
```

Accede a la aplicación en [http://localhost:3000](http://localhost:3000).

## Funcionalidades de Administración

- **Login local y con Google:** Acceso seguro para administradores.
- **Vista protegida de contactos:** Tabla con buscador por nombre/email.
- **Vista protegida de pagos:** Tabla con filtros por referencia, estado y rango de fechas.
- **Gestión de sesiones:** Cookies seguras, expiración por inactividad.
- **Metadatos OG:** Para compartir en redes sociales.
- **Mensajes flash:** Notificaciones de éxito/error.

## Estructura de Carpetas

```
src/
  controllers/
  models/
  services/
  config/
  views/
  public/
    js/
    css/
    img/
```
