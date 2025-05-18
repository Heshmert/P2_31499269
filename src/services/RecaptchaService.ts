// src/services/RecaptchaService.ts

import fetch from 'node-fetch'; // Asegúrate de que node-fetch@2 y @types/node-fetch@2 estén instalados
import dotenv from 'dotenv';


// --- Exportamos la clase como la EXPORTACIÓN POR DEFECTO ---
export default class RecaptchaService {
    private secretKey: string | undefined;
    private verifyUrl: string = 'https://www.google.com/recaptcha/api/siteverify';

    constructor() {
        this.secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!this.secretKey) {
            console.warn('ADVERTENCIA: La clave secreta de reCAPTCHA (RECAPTCHA_SECRET_KEY) no está configurada en .env. La verificación reCAPTCHA no funcionará.');
        }
    }

    /**
     * Verifica el token de reCAPTCHA enviado por el cliente con la API de Google.
     * @param token El token g-recaptcha-response recibido del cliente.
     * @param ipAddress La dirección IP del cliente (opcional, pero recomendado por Google).
     * @returns Promise<boolean> True si la verificación fue exitosa, false en caso contrario.
     */
    async verifyRecaptcha(token: string, ipAddress?: string): Promise<boolean> {
        if (!this.secretKey) {
            console.error('RecaptchaService: No se puede verificar reCAPTCHA. La clave secreta no está configurada.');
            return false; // Fail secure si la clave no está
        }

        // Si no se recibe el token, la verificación falla
        if (!token) {
             console.warn('RecaptchaService: Token de reCAPTCHA no recibido.');
             return false;
        }

        try {
            // Construir el cuerpo de la solicitud con la clave secreta y el token
            const requestBody = `secret=${encodeURIComponent(this.secretKey)}&response=${encodeURIComponent(token)}${ipAddress ? `&remoteip=${encodeURIComponent(ipAddress)}` : ''}`;

            // Realizar la solicitud POST a la API de verificación de Google
            const response = await fetch(this.verifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: requestBody,
            });
            const data = await response.json();

            console.log('RecaptchaService: Respuesta de la API de Google:', data);
            return data.success === true;

        } catch (error) {
            console.error('RecaptchaService: Error al comunicarse con la API de verificación de reCAPTCHA:', error);
            return false;
        }
    }
}
