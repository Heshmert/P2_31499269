# Ciclexespress: Taller de reparacion de bicicletas y patinetas electricas.


Este proyecto corresponde a una aplicación web desarrollada con Node.js, Express y TypeScript, cuyo objetivo es gestionar formularios de contacto y simular un proceso de pago, enviando confirmaciones por correo electrónico a los usuarios y notificaciones internas al administrador.

## Características

- Formulario de contacto con validación y protección mediante reCAPTCHA.
- Envío automático de correo de confirmación al usuario tras un contacto exitoso.
- Notificación por correo electrónico al administrador/profesor sobre nuevos contactos.
- Simulación de proceso de pago a través de una API externa.
- Envío de correo de confirmación de pago al usuario.
- Base de datos SQLite para la persistencia de datos (contactos y mensajes).
- Manejo de variables de entorno para una configuración segura.
- Implementación en TypeScript para mayor robustez y mantenibilidad.

## Tecnologías Utilizadas

**Backend:**
- [Node.js](https://nodejs.org/): Entorno de ejecución.
- [Express.js](https://expressjs.com/): Framework web para Node.js.
- [TypeScript](https://www.typescriptlang.org/): Lenguaje de programación.
- [SQLite](https://www.sqlite.org/): Base de datos relacional ligera.
- [Nodemailer](https://nodemailer.com/): Envío de correos electrónicos.
- [dotenv](https://www.npmjs.com/package/dotenv): Carga de variables de entorno.
- [node-fetch](https://www.npmjs.com/package/node-fetch) (versión 2): Solicitudes HTTP a la API de pago.
- [connect-flash](https://www.npmjs.com/package/connect-flash): Mensajes flash temporales.
- [express-session](https://www.npmjs.com/package/express-session): Gestión de sesiones.
- [ejs](https://www.npmjs.com/package/ejs): Motor de plantillas para Express.

**Herramientas de Desarrollo:**
- [npm](https://www.npmjs.com/): Gestor de paquetes.
- [TSC (TypeScript Compiler)](https://www.typescriptlang.org/): Compilador de TypeScript.

## Instalación

A continuación se describen los pasos para configurar y ejecutar el proyecto en un entorno local.

### Prerrequisitos

- [Node.js](https://nodejs.org/en/download/) (se recomienda la versión LTS).
- [npm](https://docs.npmjs.com/cli/v9/commands/npm) (incluido con Node.js).

### Pasos de Instalación

1. **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    ```

2. **Instalar las dependencias:**
    ```bash
    npm install
    ```

3. **Configurar las variables de entorno:**
    - Crear un archivo llamado `.env` en la raíz del proyecto.
    - Copiar el contenido de ejemplo de `example.env` (si se proporciona) o utilizar las variables listadas en la sección "Variables de Entorno", reemplazando los valores por los correspondientes.
    - **Ejemplo de `.env`:**
        ```env
        # Configuración del Servidor
        PORT=3000
        SESSION_SECRET=su_secreto_para_sesiones_seguras_aqui

        # Configuración de Base de Datos
        DB_PATH=./data/app.db

        # Configuración de ReCAPTCHA
        RECAPTCHA_SECRET_KEY=su_clave_secreta_recaptcha_aqui

        # Configuración del Servicio de Correo (Nodemailer - para GMail con App Passwords)
        EMAIL_HOST=smtp.gmail.com
        EMAIL_PORT=465
        EMAIL_SECURE=true
        EMAIL_USER=ejemplos@ejemplo.com
        EMAIL_PASS=su_app_password_gmail_aqui # Utilice una App Password

        # Nombre del remitente de los correos
        EMAIL_NAME="Nombre de la Aplicación"

        # Correo del profesor/administrador para notificaciones
        TEACHER_EMAIL=correo.del.profe@example.com

        # Clave de API para la API de pago simulada
        FAKE_PAYMENT_API_KEY=su_clave_api_fake_payment_jwt_aqui
        ```
    - **Nota sobre `EMAIL_PASS`:** Para Gmail, se debe generar una "Contraseña de Aplicación" (App Password) en la configuración de seguridad de la cuenta de Google, ya que las contraseñas normales no funcionan directamente con SMTP.

## Uso

### Iniciar la Aplicación

Una vez instaladas las dependencias y configuradas las variables de entorno, se puede iniciar el servidor con el siguiente comando:

```bash
npm run dev
```

---