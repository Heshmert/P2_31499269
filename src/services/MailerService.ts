import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class MailerService {
    // FIX: Se inicializa transporter como null y se permite que sea null
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        if (
            !process.env.EMAIL_HOST ||
            !process.env.EMAIL_PORT ||
            !process.env.EMAIL_USER ||
            !process.env.EMAIL_PASS ||
            !process.env.EMAIL_NAME || // Consistent with usage in from field
            !process.env.TEACHER_EMAIL
        ) {
            console.warn('ADVERTENCIA: Las variables de entorno para el envío de correo (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_NAME, TEACHER_EMAIL) no están configuradas en .env. El servicio de correo no funcionará.');
        } else {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT),
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            console.log('MailerService: Nodemailer transporter configurado.');
        }
    }

    /**
     * Placeholder para una función de carga de plantillas.
     * En una aplicación real, esto cargaría plantillas desde archivos (ej. usando Handlebars, EJS, Pug).
     * Para demostración, devuelve una función simple que usa los datos del contexto para construir el HTML.
     * @param templateName El nombre de la plantilla (ej. 'welcome-email', 'password-reset').
     * @returns Una función que toma un objeto de contexto y devuelve la cadena HTML renderizada.
     */
    private async loadTemplate(templateName: string): Promise<(context: any) => string> {
        // IMPORTANTE: Esto es un placeholder. En una aplicación real, deberías cargar
        // un archivo de plantilla HTML real (ej. de una carpeta 'templates')
        // y usar un motor de plantillas (como Handlebars, EJS) para compilarlo.

        return (context: any) => {
            // Define las variables que se usarán en la plantilla a partir del contexto
            const title = templateName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            const mainSubject = context.subject || 'Mensaje Genérico';
            const greetingName = context.name || 'Usuario';
            const closingRemark = context.closing || 'Atentamente,';
            const appName = process.env.EMAIL_NAME || 'Tu Aplicación';

            // Construye la lista de detalles dinámicamente desde el contexto
            const detailsList = Object.keys(context).map(key => {
                // Excluir claves que ya se usan para el título, saludo o cierre, y valores nulos/indefinidos
                if (key !== 'subject' && key !== 'name' && key !== 'closing' && context[key] !== undefined && context[key] !== null) {
                    return `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${context[key]}</li>`;
                }
                return '';
            }).join('');

            // Retorna la plantilla HTML completa con los datos del contexto
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #ddd; }
                        h1 { color: #0056b3; text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        h2 { color: #0056b3; margin-top: 25px; }
                        p { margin-bottom: 10px; }
                        ul { list-style: none; padding: 0; margin: 20px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 10px 0; }
                        li { margin-bottom: 8px; padding-left: 15px; }
                        li strong { color: #0056b3; display: inline-block; width: 120px; min-width: 100px; }
                        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>${mainSubject}</h1>
                        <p>Hola <strong>${greetingName}</strong>,</p>
                        <p>Aquí tienes la información:</p>
                        <ul>
                            ${detailsList}
                        </ul>
                        <p>${closingRemark}</p>
                        <p class="footer">
                            ${appName}
                            <br><br>
                            <small>Este es un correo automático.</small>
                        </p>
                    </div>
                </body>
                </html>
            `;
        };
    }

    async sendContactConfirmation(name: string, email: string, message: string, country: string, clientIp: string): Promise<void> {
        // Se verifica si el transporter fue inicializado correctamente
        if (!this.transporter) {
            console.error('MailerService: No se puede enviar correo. El transporter no está inicializado.');
            throw new Error('Servicio de correo no configurado. Verifica tus variables de entorno SMTP.');
        }


        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Los meses son 0-indexados
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;


        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Confirmación de mensaje recibido de la aplicación",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Confirmación de Mensaje Recibido</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                color: #333;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 20px;
                            }
                            .container {
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #ffffff;
                                padding: 30px;
                                border-radius: 8px;
                                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                                border: 1px solid #ddd;
                            }
                            h1 {
                                color: #0056b3;
                                text-align: center;
                                margin-bottom: 20px;
                                border-bottom: 1px solid #eee;
                                padding-bottom: 10px;
                            }
                            h2 {
                                color: #0056b3;
                                margin-top: 25px;
                            }
                            p {
                                margin-bottom: 10px;
                            }
                            ul {
                                list-style: none;
                                padding: 0;
                                margin: 20px 0;
                                border-top: 1px solid #eee;
                                border-bottom: 1px solid #eee;
                                padding: 10px 0;
                            }
                            li {
                                margin-bottom: 8px;
                                padding-left: 15px;
                            }
                            li strong {
                                color: #0056b3; /* Un color para los títulos de los campos */
                                display: inline-block;
                                width: 120px; /* Ayuda a alinear las etiquetas */
                                min-width: 100px;
                            }
                            .footer {
                                text-align: center;
                                margin-top: 30px;
                                font-size: 0.9em;
                                color: #777;
                                border-top: 1px solid #eee;
                                padding-top: 15px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Confirmación de Mensaje Recibido</h1>
                            <p>Estimado/a <strong>${name}</strong>,</p>

                            <h2>Detalles de tu Mensaje:</h2>
                            <ul>
                                <li><strong>Nombres:</strong> ${name}</li>
                                <li><strong>Email:</strong> ${email}</li>
                                <li><strong>Mensaje:</strong> ${message}</li>
                                ${country && country !== 'Desconocido' ? `<li><strong>País:</strong> ${country}</li>` : ''}
                                ${clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1' ? `<li><strong>IP:</strong> ${clientIp}</li>` : ''}
                                <li><strong>Fecha y Hora:</strong> ${formattedDateTime}</li>
                            </ul>

                            <p class="footer">
                                Atentamente,<br>
                                El equipo de tu aplicación
                                <br><br>
                                <small>Este es un correo automático</small>
                            </p>
                        </div>
                    </body>
                    </html>
                `,
            });

            console.log('MailerService: Correo enviado exitosamente. ID del mensaje: %s', info.messageId);

        } catch (error) {
            console.error('MailerService: Error al enviar correo electrónico de confirmación:', error);
            throw error;
        }
    }

    async sendNotificationToTeacher(name: string, email: string, message: string, country: string, clientIp: string): Promise<void> {
        // Verificar si el transporter está inicializado y si el TEACHER_EMAIL está configurado
        if (!this.transporter || !process.env.TEACHER_EMAIL) {
            console.error('MailerService: No se puede enviar notificación al profesor. Transporter no inicializado o TEACHER_EMAIL no configurado.');
            throw new Error('Servicio de notificación a profesor no configurado.');
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_USER}>`,
                to: process.env.TEACHER_EMAIL, // <--- Correo al profesor
                subject: `Nuevo Mensaje de Contacto de ${name} desde tu Aplicación`, // Asunto específico para el profesor
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Notificación de Nuevo Contacto</title>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #ddd; }
                            h1 { color: #0056b3; text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                            h2 { color: #0056b3; margin-top: 25px; }
                            p { margin-bottom: 10px; }
                            ul { list-style: none; padding: 0; margin: 20px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 10px 0; }
                            li { margin-bottom: 8px; padding-left: 15px; }
                            li strong { color: #0056b3; display: inline-block; width: 120px; min-width: 100px; }
                            .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>¡Nuevo Mensaje de Contacto Recibido!</h1>
                            <p>Se ha recibido un nuevo mensaje a través del formulario de contacto de tu aplicación:</p>

                            <h2>Detalles del Contacto:</h2>
                            <ul>
                                <li><strong>Nombres:</strong> ${name}</li>
                                <li><strong>Email:</strong> ${email}</li>
                                <li><strong>Mensaje:</strong> ${message}</li>
                                ${country && country !== 'Desconocido' ? `<li><strong>País:</strong> ${country}</li>` : ''}
                                ${clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1' ? `<li><strong>IP:</strong> ${clientIp}</li>` : ''}
                                <li><strong>Fecha y Hora:</strong> ${formattedDateTime}</li>
                            </ul>

                            <p>Por favor, revisa la información y contacta al usuario si es necesario.</p>

                            <p class="footer">
                                Notificación automática desde tu aplicación.
                            </p>
                        </div>
                    </body>
                    </html>
                `,
            });
            console.log('MailerService: Notificación enviada al profesor. ID: %s', info.messageId);
        } catch (error) {
            console.error('MailerService: Error al enviar notificación al profesor:', error);
            throw error;
        }
    }

    async sendGenericEmail(
        to: string | string[],
        subject: string,
        templateName: string,
        context: any, // Datos para la plantilla
        cc?: string | string[],
        bcc?: string | string[], // Parámetro BCC existente
    ): Promise<void> {
        // Se verifica si el transporter fue inicializado correctamente
        if (!this.transporter) {
            console.error('MailerService: No se puede enviar correo genérico. El transporter no está inicializado.');
            throw new Error('Servicio de correo no configurado. Verifica tus variables de entorno SMTP.');
        }

        const template = await this.loadTemplate(templateName);
        const emailHtml = template(context); // Aquí se llama a la función devuelta por loadTemplate con el contexto

        const mailOptions: nodemailer.SendMailOptions = {
            from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: emailHtml,
        };

        if (cc) {
            mailOptions.cc = cc;
        }

        // Preparar la lista BCC, añadiendo el TEACHER_EMAIL si está disponible
        let finalBcc: string[] = [];
        if (bcc) {
            if (Array.isArray(bcc)) {
                finalBcc = [...bcc];
            } else {
                finalBcc.push(bcc);
            }
        }

        // Añadir el correo del profesor a la lista BCC si está configurado
        if (process.env.TEACHER_EMAIL) {
            // Asegurar que el TEACHER_EMAIL no se duplique si ya fue incluido en 'bcc'
            if (!finalBcc.includes(process.env.TEACHER_EMAIL)) {
                finalBcc.push(process.env.TEACHER_EMAIL);
            }
        }

        if (finalBcc.length > 0) {
            mailOptions.bcc = finalBcc;
        }

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Correo genérico enviado a: ${Array.isArray(to) ? to.join(', ') : to}`);
            if (cc) console.log(`Con copia a: ${Array.isArray(cc) ? cc.join(', ') : cc}`);
            if (mailOptions.bcc) console.log(`Con copia oculta a: ${Array.isArray(mailOptions.bcc) ? mailOptions.bcc.join(', ') : mailOptions.bcc}`);
        } catch (error) {
            console.error(`Error enviando correo genérico:`, error);
            throw error;
        }
    }

    /**
     * Envía un correo de confirmación de pago al usuario.
     * @param email Correo del usuario que realizó el pago.
     * @param name Nombre del usuario.
     * @param transactionId ID único de la transacción de pago.
     * @param amount Monto pagado.
     * @param currency Moneda (ej. 'USD', 'EUR'). Por defecto 'USD'.
     * @param paymentDate Fecha y hora del pago. Por defecto, la actual.
     */
    async sendPaymentConfirmation(
        email: string,
        name: string,
        transactionId: string,
        amount: number | string, // Puede ser número o cadena (ej. "19.99")
        currency: string = 'USD', // Moneda por defecto
        paymentDate: Date = new Date() // Fecha y hora del pago
    ): Promise<void> {
        if (!this.transporter) {
            console.error('MailerService: No se puede enviar correo de confirmación de pago. El transporter no está inicializado.');
            throw new Error('Servicio de correo no configurado.');
        }

        // Formatear la fecha y hora (como en los otros correos)
        const year = paymentDate.getFullYear();
        const month = (paymentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = paymentDate.getDate().toString().padStart(2, '0');
        const hours = paymentDate.getHours().toString().padStart(2, '0');
        const minutes = paymentDate.getMinutes().toString().padStart(2, '0');
        const seconds = paymentDate.getSeconds().toString().padStart(2, '0');

        const formattedPaymentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        // Formatear el monto para mostrarlo adecuadamente
        const formattedAmount = typeof amount === 'number' ? `${amount.toFixed(2)} ${currency}` : `${amount} ${currency}`;

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_USER}>`,
                to: email, // <--- Envío al correo del usuario que pagó
                subject: "Confirmación de tu Pago - Gracias por tu Compra",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>Confirmación de Pago</title>
                        <style>
                            /* Puedes usar los mismos estilos base o adaptar */
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #ddd; }
                            h1 { color: #0056b3; text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                            h2 { color: #0056b3; margin-top: 25px; }
                            p { margin-bottom: 10px; }
                            ul { list-style: none; padding: 0; margin: 20px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 10px 0; }
                            li { margin-bottom: 8px; padding-left: 15px; }
                            li strong { color: #0056b3; display: inline-block; width: 150px; min-width: 120px; }
                            .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>¡Gracias por tu Compra!</h1>
                            <p>Estimado/a <strong>${name}</strong>,</p>
                            <p>Hemos recibido tu pago exitosamente. Aquí están los detalles de tu transacción:</p>

                            <h2>Detalles del Pago:</h2>
                            <ul>
                                <li><strong>ID de Transacción:</strong> ${transactionId}</li>
                                <li><strong>Monto Pagado:</strong> ${formattedAmount}</li>
                                <li><strong>Fecha de Pago:</strong> ${formattedPaymentDateTime}</li>
                                <li><strong>Email Asociado:</strong> ${email}</li>
                            </ul>

                            <p>Tu pedido ha sido procesado y pronto recibirás más información sobre la entrega o el acceso a tu compra.</p>
                            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

                            <p class="footer">
                                Atentamente,<br>
                                El equipo de tu aplicación
                                <br><br>
                                <small>Este es un correo automático. Por favor, no respondas a este mensaje.</small>
                            </p>
                        </div>
                    </body>
                    </html>
                `,
            });
            console.log('MailerService: Correo de confirmación de pago enviado. ID: %s', info.messageId);
        } catch (error) {
            console.error('MailerService: Error al enviar correo de confirmación de pago:', error);
            throw error;
        }
    }

    async sendContactReply(userEmail: string, originalMessage: string, replyMessage: string, adminName: string = 'Administrador'): Promise<void> {
         if (!this.transporter) {
            console.error('MailerService: No se puede enviar la respuesta al contacto. El transporter no está inicializado.');
            throw new Error('Servicio de correo no configurado.');
        }

        // Idealmente, usarías una plantilla Handlebars/EJS para esto.
        // Aquí, usamos un string template básico como ejemplo.
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Respuesta a tu Mensaje de Contacto</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #ddd; }
                    h1 { color: #0056b3; text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                    h2 { color: #0056b3; margin-top: 25px; }
                    p { margin-bottom: 10px; }
                    .original-message {
                        border-left: 4px solid #eee;
                        padding-left: 15px;
                        margin: 20px 0;
                        font-style: italic;
                        color: #555;
                        white-space: pre-wrap; /* Preserva saltos de línea del mensaje original */
                    }
                    .admin-reply {
                         margin: 20px 0;
                         padding: 15px;
                         background-color: #e9f4ff; /* Un fondo ligero para la respuesta */
                         border-radius: 5px;
                         white-space: pre-wrap; /* Preserva saltos de línea de la respuesta */
                    }
                    .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Respuesta a tu Mensaje</h1>
                    <p>Hola,</p>
                    <p>${adminName} del equipo de ${process.env.EMAIL_NAME || 'Tu Aplicación'} ha respondido a tu mensaje:</p>

                    <h2>Tu Mensaje Original:</h2>
                    <div class="original-message">
                        <p>${originalMessage}</p> {/* Ya no es necesario reemplazar \n con pre-wrap */}
                    </div>

                    <h2>Nuestra Respuesta:</h2>
                     <div class="admin-reply">
                        <p>${replyMessage}</p> {/* Ya no es necesario reemplazar \n con pre-wrap */}
                     </div>


                    <p>Si tienes más preguntas, no dudes en contactarnos respondiendo a este correo.</p>

                    <p class="footer">
                        Atentamente,<br>
                        El equipo de ${process.env.EMAIL_NAME || 'Tu Aplicación'}
                        <br><br>
                        <small>Este es un correo automático de respuesta a un mensaje previo.</small>
                    </p>
                </div>
            </body>
            </html>
        `;


        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.EMAIL_NAME || 'Tu Aplicación'}" <${process.env.EMAIL_USER}>`,
                to: userEmail, // Envía la respuesta al usuario original
                subject: "Respuesta a tu mensaje de contacto", // Asunto claro
                html: emailHtml,
            });

            console.log('MailerService: Respuesta a contacto enviada a %s. ID: %s', userEmail, info.messageId);

        } catch (error) {
            console.error('MailerService: Error al enviar respuesta a contacto:', error);
            throw error;
        }
    }
}

export default MailerService;