import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class MailerService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        if (
            !process.env.EMAIL_HOST ||
            !process.env.EMAIL_PORT ||
            !process.env.EMAIL_USER ||
            !process.env.EMAIL_PASS ||
            !process.env.EMAIL_NAME
        ) {
            console.warn('ADVERTENCIA: Variables de entorno de correo no configuradas.');
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
        }
    }

    // Método base para enviar correo
    private async sendMail(
        to: string | string[],
        subject: string,
        html: string,
        sendToTeacher: boolean = false
    ): Promise<void> {
        if (!this.transporter) throw new Error('Servicio de correo no configurado.');
        const recipients = Array.isArray(to) ? [...to] : [to];
        if (sendToTeacher && process.env.TEACHER_EMAIL && !recipients.includes(process.env.TEACHER_EMAIL)) {
            recipients.push(process.env.TEACHER_EMAIL);
        }
        await this.transporter.sendMail({
            from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL_USER}>`,
            to: recipients,
            subject,
            html,
        });
    }

    // 1. Confirmación de pago al usuario
    async sendPaymentConfirmation(email: string, name: string, transactionId: string, amount: number | string, currency = 'USD', paymentDate: Date = new Date()) {
        const formattedDate = paymentDate.toLocaleString();
        const formattedAmount = typeof amount === 'number' ? `${amount.toFixed(2)} ${currency}` : `${amount} ${currency}`;
        const html = `
            <h1>¡Gracias por tu Compra!</h1>
            <p>Estimado/a <strong>${name}</strong>,</p>
            <p>Hemos recibido tu pago exitosamente.</p>
            <ul>
                <li><strong>ID de Transacción:</strong> ${transactionId}</li>
                <li><strong>Monto Pagado:</strong> ${formattedAmount}</li>
                <li><strong>Fecha de Pago:</strong> ${formattedDate}</li>
                <li><strong>Email Asociado:</strong> ${email}</li>
            </ul>
            <p>Este es un correo automático.</p>
        `;
        await this.sendMail(email, "Confirmación de tu Pago - Gracias por tu Compra", html);
    }

    // 2. Confirmación de contacto (al usuario y/o profesor)
    async sendContactConfirmation(
        name: string,
        email: string,
        message: string,
        country: string,
        clientIp: string,
        sendToTeacher = false,
        userId?: number,
        createdAt?: string
    ) {
        const html = `
            <h1>Confirmación de Mensaje Recibido</h1>
            <p>Estimado/a <strong>${name}</strong>,</p>
            <ul>
                <li><strong>ID de Usuario:</strong> ${userId ?? 'No disponible'}</li>
                <li><strong>Nombres:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Mensaje:</strong> ${message}</li>
                <li><strong>País:</strong> ${country}</li>
                <li><strong>IP:</strong> ${clientIp}</li>
                <li><strong>Fecha de Registro:</strong> ${createdAt ?? 'No disponible'}</li>
            </ul>
            <p>Este es un correo automático.</p>
        `;
        await this.sendMail(email, "Confirmación de mensaje recibido", html, sendToTeacher);
    }

    // 3. Respuesta a mensaje (al usuario y/o profesor)
    async sendContactReply(userEmail: string, originalMessage: string, replyMessage: string, adminName = 'Administrador', sendToTeacher = false) {
        const html = `
            <h1>Respuesta a tu Mensaje</h1>
            <p>${adminName} ha respondido a tu mensaje:</p>
            <h2>Tu Mensaje Original:</h2>
            <div style="border-left:4px solid #eee;padding-left:15px;">${originalMessage}</div>
            <h2>Nuestra Respuesta:</h2>
            <div style="background:#e9f4ff;padding:15px;border-radius:5px;">${replyMessage}</div>
            <p>Este es un correo automático.</p>
        `;
        await this.sendMail(userEmail, "Respuesta a tu mensaje de contacto", html, sendToTeacher);
    }
}

export default MailerService;