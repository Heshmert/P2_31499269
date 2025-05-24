// src/services/RecaptchaService.ts

import fetch from 'node-fetch';
import dotenv from 'dotenv';

export default class RecaptchaService {
    private secretKey: string | undefined;
    private verifyUrl: string = 'https://www.google.com/recaptcha/api/siteverify';

    constructor() {
        this.secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!this.secretKey) {
            console.warn('ADVERTENCIA: La clave secreta de reCAPTCHA (RECAPTCHA_SECRET_KEY) no está configurada en .env. La verificación reCAPTCHA no funcionará.');
        }
    }

    // Verifica el token de reCAPTCHA con la API de Google
    async verifyRecaptcha(token: string, ipAddress?: string): Promise<boolean> {
        if (!this.secretKey) {
            console.error('RecaptchaService: No se puede verificar reCAPTCHA. La clave secreta no está configurada.');
            return false;
        }
        if (!token) {
            console.warn('RecaptchaService: Token de reCAPTCHA no recibido.');
            return false;
        }

        try {
            const requestBody = `secret=${encodeURIComponent(this.secretKey)}&response=${encodeURIComponent(token)}${ipAddress ? `&remoteip=${encodeURIComponent(ipAddress)}` : ''}`;
            const response = await fetch(this.verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: requestBody,
            });
            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('RecaptchaService: Error al comunicarse con la API de verificación de reCAPTCHA:', error);
            return false;
        }
    }
}
