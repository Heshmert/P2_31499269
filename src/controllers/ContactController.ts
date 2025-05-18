// src/controllers/ContactController.ts

import { Request, Response } from 'express';
import ContactsModel from '../models/ContactsModel';
import MailerService from '../services/MailerService';
import RecaptchaService from '../services/RecaptchaService';

// Asegúrate de que fetch esté importado si lo usas para geolocalización
import fetch from 'node-fetch';


class ContactController {
    private contactsModel: ContactsModel;
    private mailerService: MailerService;
    // --- Declara la propiedad RecaptchaService ---
    private recaptchaService: RecaptchaService;

    // --- Asegúrate de que el constructor reciba RecaptchaService ---
    constructor(contactsModel: ContactsModel, mailerService: MailerService, recaptchaService: RecaptchaService) {
        this.contactsModel = contactsModel;
        this.mailerService = mailerService;
        // --- Asigna el servicio de reCAPTCHA ---
        this.recaptchaService = recaptchaService;

        // Atar (bind) los métodos para mantener el contexto 'this'
        this.showContactForm = this.showContactForm.bind(this);
        this.add = this.add.bind(this);
    }

    // Método para mostrar el formulario de contacto
    showContactForm(req: Request, res: Response): void {
        console.log('CONTACTS CONTROLLER - showContactForm: Ejecutando GET /contacto.');
        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');

        // Ahora usamos res.render()
        res.render('contact', { // Asume que tienes una vista 'contact.ejs' o similar
            pageTitle: 'Contacto',
            successMessage: successMessage.length > 0 ? successMessage[0] : null,
            errorMessage: errorMessage.length > 0 ? errorMessage[0] : null,
            // --- Pasa la clave de sitio reCAPTCHA a la vista ---
            recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY // <-- Asegúrate de tener esta variable en .env y en tu vista
        });
    }

    // Método para manejar el envío del formulario de contacto (POST)
    async add(req: Request, res: Response): Promise<void> {
        console.log('CONTACTS CONTROLLER - add: Ejecutando POST /contacto.'); // Ajusta la ruta si es diferente
        console.log('CONTACTS CONTROLLER - req.body recibido:', req.body);

        // --- Incluye la recepción del token de reCAPTCHA ---
        const { name, email, message, 'g-recaptcha-response': recaptchaToken } = req.body;

         // Validación básica de campos (ahora incluye reCAPTCHA)
        if (!name || !email || !message || !recaptchaToken) {
            console.log('Validation failed: Faltan campos obligatorios o el token reCAPTCHA.');
            req.flash('error', 'Error: Todos los campos obligatorios y la verificación reCAPTCHA son necesarios.');
            return res.redirect('/contacto');
        }

        // Lógica para obtener la IP del cliente
        let clientIp: string;
        const xForwardedForHeader = req.headers['x-forwarded-for'];

        if (xForwardedForHeader) {
            let ips: string[] = [];
            if (typeof xForwardedForHeader === 'string') {
                ips = xForwardedForHeader.split(',').map((ip: string) => ip.trim()); // <-- Corregido: tipado 'ip'
            } else if (Array.isArray(xForwardedForHeader)) {
                // --- Corregido: error tipográfico en el nombre de la variable y tipado 'ip' ---
                ips = xForwardedForHeader.map((ip: string) => ip.trim());
            }
            clientIp = ips[0] || req.ip || 'Desconocida';
        } else {
            clientIp = req.ip || 'Desconocida';
        }
        console.log('CONTACTS CONTROLLER - IP capturada:', clientIp);

        let country = 'Desconocido'; // Lógica de geolocalización si la tienes

        // --- Lógica de verificación de reCAPTCHA ---
         // Esta verificación ya no es estrictamente necesaria aquí si el constructor
         // asegura que el servicio se inyecta, pero puede ser útil para depurar.
         if (!this.recaptchaService) {
             console.error('RecaptchaService no inicializado en ContactController');
             req.flash('error', 'Error interno: Servicio de verificación no disponible.');
             return res.redirect('/contacto');
         }

        try {
             console.log('Verificando reCAPTCHA...');
             const recaptchaSuccess = await this.recaptchaService.verifyRecaptcha(recaptchaToken, clientIp);

             if (!recaptchaSuccess) {
                 console.warn('Verificación de reCAPTCHA fallida.');
                 req.flash('error', 'Error: La verificación reCAPTCHA falló. Por favor, intenta de nuevo.');
                 return res.redirect('/contacto');
             }
             console.log('Verificación de reCAPTCHA exitosa.');

        } catch (recaptchaError) {
             console.error('Error en el servicio reCAPTCHA:', recaptchaError);
             req.flash('error', 'Error interno al verificar reCAPTCHA. Por favor, intenta de nuevo más tarde.');
             return res.redirect('/contacto');
        }
        // ---------------------------------------------------------


        try {
            // Usar ContactsModel para guardar el contacto
            await this.contactsModel.addContact(name, email, message, country, clientIp);
            console.log('Contacto guardado exitosamente en la base de datos.');

            // Usar MailerService para enviar los correos electrónicos
            try {
                 // Usar el método genérico para enviar email al usuario y BCC al profesor
                await this.mailerService.sendGenericEmail(
                    email, // 'to' user's email
                    'Confirmación de mensaje recibido de la aplicación', // subject
                    'contactConfirmation', // template name (assuming you create this template)
                    { // context for template (adapt keys to your template)
                        name: name,
                        email: email,
                        message: message,
                        country: country,
                        clientIp: clientIp,
                        timestamp: new Date().toLocaleString(),
                        subject: 'Confirmación de Mensaje Recibido', // Pasado a plantilla genérica
                        closing: 'Gracias por ponerte en contacto con nosotros. Te responderemos a la brevedad posible.' // Pasado a plantilla genérica
                    },
                     undefined, // Pasa undefined explícitamente para cc si no hay copia
                     // El BCC al profesor ya se añade automáticamente dentro de sendGenericEmail si está configurado
                );
                 console.log('CONTACTS CONTROLLER - Correo de confirmación enviado exitosamente al usuario (y BCC al profesor si está configurado).');


            } catch (emailError) {
                console.error('CONTACTS CONTROLLER - Error al intentar enviar uno o ambos correos:', emailError);
                 req.flash('success', '¡Gracias por tu mensaje! Lo hemos recibido correctamente, aunque hubo un problema al enviar los correos de confirmación/notificación.');
                 return res.redirect('/contacto');
            }

            // Si todo (guardar en DB y enviar correos) fue exitoso
            req.flash('success', '¡Gracias por tu mensaje! Lo hemos recibido correctamente.');
            res.redirect('/contacto');

        } catch (dbError) {
            console.error('Error al insertar contacto en la base de datos:', dbError);
            req.flash('error', 'Hubo un error interno al enviar tu mensaje. Por favor, intenta de nuevo más tarde.');
            res.redirect('/contacto');
        }
    }
}

export default ContactController;
