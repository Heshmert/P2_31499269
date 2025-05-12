// src/controllers/ContactController.ts

import { Request, Response } from 'express';
import fetch from 'node-fetch';

import ContactsModel from '../models/ContactsModel'; 
import MailerService from '../services/MailerService'; 

class ContactController {
    private readonly RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
    private readonly GEOLOCATION_API_URL = 'http://ip-api.com/json/';
    
    private contactsModel: ContactsModel; 
    private mailerService: MailerService;

    constructor(contactsModel: ContactsModel, mailerService: MailerService) { 
        this.contactsModel = contactsModel;
        this.mailerService = mailerService;

        this.index = this.index.bind(this);
        this.add = this.add.bind(this);
        this.showContactForm = this.showContactForm.bind(this);

        if (!this.RECAPTCHA_SECRET_KEY) {
            console.warn('ADVERTENCIA: RECAPTCHA_SECRET_KEY no está configurada en .env. La verificación de reCAPTCHA no funcionará.');
        }
    }

    async index(req: Request, res: Response): Promise<void> {
        console.log('CONTACTS CONTROLLER - index: Ejecutando GET /admin/contacts.');
        try {
            const contacts = await this.contactsModel.getAllContacts(); 
            res.render('admin/contacts', { 
                pageTitle: 'Administrar Contactos',
                contacts: contacts
            });
        } catch (error) {
            console.error('Error al cargar contactos para el panel de administración:', error);
            req.flash('error', 'Error al cargar los contactos.');
            res.redirect('contacts');
        }
    }

    showContactForm(req: Request, res: Response): void {
        console.log('CONTACTS CONTROLLER - showContactForm: Ejecutando GET /contacto.');
        const successMessage = req.flash('success');
        const errorMessage = req.flash('error');
        res.render('contacto', { 
            pageTitle: 'Contacto',
            successMessage: successMessage.length > 0 ? successMessage[0] : null,
            errorMessage: errorMessage.length > 0 ? errorMessage[0] : null
        });
    }

    async add(req: Request, res: Response): Promise<void> {
        console.log('CONTACTS CONTROLLER - add: Ejecutando POST /contact/add.');
        console.log('CONTACTS CONTROLLER - req.body recibido:', req.body);

        const { name, email, message, 'g-recaptcha-response': recaptchaToken } = req.body;
        
        // FIX: Lógica más robusta para obtener clientIp y asegurar que sea string
        let clientIp: string;
        const xForwardedForHeader = req.headers['x-forwarded-for'];

        if (xForwardedForHeader) {
            let ips: string[] = [];
            if (typeof xForwardedForHeader === 'string') {
                // Si es una cadena (ej. "ip1, ip2, ip3"), la dividimos y limpiamos cada IP
                ips = xForwardedForHeader.split(',').map(ip => ip.trim());
            } else if (Array.isArray(xForwardedForHeader)) {
                // Si ya es un array, simplemente limpiamos cada IP
                ips = xForwardedForHeader.map(ip => ip.trim());
            }
            
            // Por convención, la primera IP en X-Forwarded-For es la del cliente real
            clientIp = ips[0] || req.ip || 'Desconocida'; 
        } else {
            // Si no hay encabezado X-Forwarded-For, usamos req.ip como fallback
            clientIp = req.ip || 'Desconocida';
        }

        
        // Asegura que clientIp no esté vacío o nulo (aunque req.ip casi siempre es string)
        clientIp = clientIp || 'Desconocida'; 

        console.log('CONTACTS CONTROLLER - IP capturada:', clientIp);
        console.log(`Intentando geolocalizar IP: ${clientIp}`);

        // ===========================================
        // ***** 1. Verificación de reCAPTCHA (Lado del Servidor) *****
        // ===========================================
        if (!this.RECAPTCHA_SECRET_KEY) {
            console.error('Error: RECAPTCHA_SECRET_KEY no está configurada en .env.');
            req.flash('error', 'Error interno: La clave secreta de reCAPTCHA no está configurada. Contacta al administrador.');
            return res.redirect('/contacto');
        }

        if (!recaptchaToken) {
            console.error('Error de reCAPTCHA: Token no recibido del formulario.');
            req.flash('error', 'Por favor, verifica que no eres un robot (reCAPTCHA) antes de enviar el mensaje.');
            return res.redirect('/contacto');
        }

        try {
            const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${this.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
            const recaptchaResponse = await fetch(verifyUrl, { method: 'POST' });
            const recaptchaJson = await recaptchaResponse.json();

            if (!recaptchaJson.success) {
                console.error('Verificación de reCAPTCHA fallida:', recaptchaJson['error-codes']);
                let errorMessage = 'Verificación reCAPTCHA fallida. Por favor, intenta de nuevo.';
                if (recaptchaJson['error-codes'] && recaptchaJson['error-codes'].includes('missing-input-response')) {
                    errorMessage = 'Por favor, verifica que no eres un robot (reCAPTCHA) antes de enviar.';
                } else if (recaptchaJson['error-codes'] && recaptchaJson['error-codes'].includes('invalid-input-response')) {
                     errorMessage = 'Verificación reCAPTCHA inválida o expirada. Recarga la página e intenta de nuevo.';
                } else if (recaptchaJson['error-codes'] && recaptchaJson['error-codes'].includes('timeout-or-duplicate')) {
                    errorMessage = 'El reCAPTCHA expiró o ya fue usado. Recarga la página e intenta de nuevo.';
                }
                req.flash('error', errorMessage);
                return res.redirect('/contacto');
            }
            console.log('Verificación de reCAPTCHA exitosa.');

        } catch (recaptchaError) {
            console.error('Error al comunicarse con la API de verificación de reCAPTCHA de Google:', recaptchaError);
            req.flash('error', 'Error de conexión al verificar reCAPTCHA. Por favor, intenta de nuevo más tarde.');
            return res.redirect('/contacto');
        }

        // ===========================================
        // ***** 2. Validación de campos obligatorios del formulario de contacto *****
        // ===========================================
        if (!name || !email || !message) {
            console.log('Validation failed: Faltan campos obligatorios en el formulario de contacto.');
            req.flash('error', 'Error: Todos los campos del formulario de contacto son obligatorios.');
            return res.redirect('/contacto');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Validation failed: Formato de email inválido.');
            req.flash('error', 'Error: Por favor, introduce un formato de correo electrónico válido.');
            return res.redirect('/contacto');
        }

        // ===========================================
        // ***** 3. Lógica de Geolocalización de la IP del cliente *****
        // ===========================================
        let country = 'Desconocido';
        try {
            const geoIpResponse = await fetch(`${this.GEOLOCATION_API_URL}${clientIp}`);
            const geoIpData = await geoIpResponse.json();

            if (geoIpResponse.ok && geoIpData.status === 'success') {
                country = geoIpData.country;
                console.log(`País de la IP ${clientIp}: ${country}`);
            } else {
                console.error(`API Geolocalización: Error al obtener país para IP ${clientIp}. Status: ${geoIpData.status}, Message: ${geoIpData.message || 'No message provided'}`);
            }
        } catch (geoError) {
            console.error(`API Geolocalización: Error al comunicarse con la API para IP ${clientIp}:`, geoError);
        }

        // ===========================================
        // ***** 4. Guardar el contacto en la Base de Datos & 5. Enviar Correo *****
        // ===========================================
        try {
            await this.contactsModel.addContact(name, email, message, country, clientIp);
            console.log('Contacto guardado exitosamente en la base de datos.');

            // LÓGICA PARA ENVIAR EL CORREO ELECTRÓNICO UTILIZANDO EL SERVICIO
            try {
                await this.mailerService.sendContactConfirmation(name, email, message, country, clientIp);
                console.log('CONTACTS CONTROLLER - Correo de confirmación enviado exitosamente.');
                req.flash('success', '¡Gracias por tu mensaje! Lo hemos recibido correctamente y se ha enviado un correo de confirmación.');
            } catch (emailError) {
                console.error('CONTACTS CONTROLLER - Error al intentar enviar correo de confirmación:', emailError);
                req.flash('success', '¡Gracias por tu mensaje! Lo hemos recibido correctamente, aunque hubo un problema al enviar el correo de confirmación.');
            }

        } catch (dbError) { 
            console.error('Error al insertar contacto en la base de datos:', dbError);
            req.flash('error', 'Hubo un error interno al enviar tu mensaje. Por favor, intenta de nuevo más tarde.');
        }

        res.redirect('/contacto');
    }
}

export default ContactController;