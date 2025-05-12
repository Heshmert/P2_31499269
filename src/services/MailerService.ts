// src/services/MailerService.ts

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
            !process.env.EMAIL_FROM_NAME
        ) {
            console.warn('ADVERTENCIA: Las variables de entorno para el envío de correo (EMAIL_HOST, SMTP_PORT, EMAIL_USER, SMTP_PASS, EMAIL_FROM_NAME) no están configuradas en .env. El servicio de correo no funcionará.');
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
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
                to: email && 'programacion2ais@yopmail.com',
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
}

export default MailerService;