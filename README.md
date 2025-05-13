# Nombre de Tu Proyecto (Ej: Sistema de Contacto y Pago)

![Logo del Proyecto](https://via.placeholder.com/150) Un breve párrafo que describa el propósito de tu proyecto. ¿Qué problema resuelve? ¿Cuál es su funcionalidad principal?

Este proyecto es una aplicación web construida con Node.js, Express y TypeScript que gestiona formularios de contacto y simula un proceso de pago, enviando confirmaciones por correo electrónico a los usuarios y notificaciones internas.

## Características ✨

* Formulario de contacto con validación y reCAPTCHA.
* Envío de correo de confirmación al usuario después de un contacto exitoso.
* Notificación por correo electrónico a un administrador/profesor sobre nuevos contactos.
* Simulación de proceso de pago a través de una API externa.
* Envío de correo de confirmación de pago al usuario.
* Base de datos SQLite para persistencia de datos (contactos).
* Manejo de variables de entorno para configuración segura.
* Implementación con TypeScript para mayor robustez y mantenibilidad.

## Tecnologías Utilizadas 🛠️

* **Backend:**
    * [Node.js](https://nodejs.org/): Entorno de ejecución.
    * [Express.js](https://expressjs.com/): Framework web para Node.js.
    * [TypeScript](https://www.typescriptlang.org/): Lenguaje de programación.
    * [SQLite](https://www.sqlite.org/): Base de datos relacional ligera.
    * [Nodemailer](https://nodemailer.com/): Para el envío de correos electrónicos.
    * [dotenv](https://www.npmjs.com/package/dotenv): Para cargar variables de entorno.
    * [node-fetch](https://www.npmjs.com/package/node-fetch) (versión 2): Para realizar solicitudes HTTP a la API de pago.
    * [connect-flash](https://www.npmjs.com/package/connect-flash): Para mensajes flash temporales.
    * [express-session](https://www.npmjs.com/package/express-session): Para la gestión de sesiones.
    * [hbs](https://www.npmjs.com/package/hbs): Motor de plantillas Handlebars para Express.
* **Herramientas de Desarrollo:**
    * [npm](https://www.npmjs.com/): Gestor de paquetes.
    * [TSC (TypeScript Compiler)](https://www.typescriptlang.org/): Compilador de TypeScript.

## Instalación 🚀

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos

* [Node.js](https://nodejs.org/en/download/) (versión LTS recomendada).
* [npm](https://docs.npmjs.com/cli/v9/commands/npm) (viene con Node.js).

### Pasos de Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git)
    cd tu-repositorio
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    * Crea un archivo llamado `.env` en la raíz del proyecto.
    * Copia el contenido de ejemplo de `example.env` (si lo proporcionas) o las variables listadas en la sección "Variables de Entorno" y reemplaza los valores con los tuyos.
    * **Ejemplo de `.env`:**
        ```env
        # Configuración del Servidor
        PORT=3000
        SESSION_SECRET=tu_secreto_para_sesiones_seguras_aqui

        # Configuración de Base de Datos
        DB_PATH=./data/app.db

        # Configuración de ReCAPTCHA
        RECAPTCHA_SECRET_KEY=tu_clave_secreta_recaptcha_aqui

        # Configuración del Servicio de Correo (Nodemailer - para GMail con App Passwords)
        SMTP_HOST=smtp.gmail.com
        SMTP_PORT=587
        SMTP_SECURE=false # Para port 587 con STARTTLS
        SMTP_USER=tu_correo@gmail.com
        SMTP_PASS=tu_app_password_gmail_aqui # Usa una App Password, NO tu contraseña de Gmail

        # Nombre del remitente de los correos
        EMAIL_FROM_NAME="Tu Nombre de Aplicacion"

        # Correo del profesor/administrador para notificaciones
        TEACHER_EMAIL=correo.del.profe@example.com

        # Clave de API para la API de pago simulada
        FAKE_PAYMENT_API_KEY=tu_clave_api_fake_payment_jwt_aqui
        ```
    * **Nota sobre `SMTP_PASS`:** Para Gmail, necesitarás generar una "Contraseña de Aplicación" (App Password) en la configuración de seguridad de tu cuenta de Google, ya que las contraseñas normales no funcionan directamente con SMTP.

4.  **Compila el código TypeScript:**
    ```bash
    npm run build
    ```
    *(Esto creará el código JavaScript en la carpeta `dist/`)*

## Uso 🚀

### Iniciar la Aplicación

Una vez instaladas las dependencias y configuradas las variables de entorno, puedes iniciar el servidor:

```bash
npm run dev