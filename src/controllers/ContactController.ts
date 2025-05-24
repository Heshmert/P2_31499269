// src/controllers/ContactController.ts

import { Request, Response } from 'express';
import ContactsModel from '../models/ContactsModel';
import MailerService from '../services/MailerService';
import RecaptchaService from '../services/RecaptchaService';

// Extiende la interfaz Request para incluir 'user'
declare global {
    namespace Express {
        interface User {
            name?: string;
            [key: string]: any;
        }
        interface Request {
            user?: User;
        }
    }
}

class ContactController {
    private contactsModel: ContactsModel;
    private mailerService: MailerService;

    constructor(contactsModel: ContactsModel, mailerService: MailerService) {
        this.contactsModel = contactsModel;
        this.mailerService = mailerService;
        this.add = this.add.bind(this);
        this.showContactForm = this.showContactForm.bind(this);
    }

    // Renderiza el formulario de contacto
    showContactForm(req: Request, res: Response): void {
        res.render('contacto', {
            pageTitle: 'Contacto'
        });
    }

    // Procesa el envío del formulario de contacto
    async add(req: Request, res: Response): Promise<void> {
        const { name, email, message } = req.body;
        const clientIp = req.ip || 'Desconocida';
        const country = 'Desconocido';

        // Valida reCAPTCHA antes de guardar el mensaje
        const recaptchaToken = req.body['g-recaptcha-response'];
        const recaptchaService = new RecaptchaService();
        const recaptchaOk = await recaptchaService.verifyRecaptcha(recaptchaToken, req.ip);

        if (!recaptchaOk) {
            req.flash('error', 'Debes completar el reCAPTCHA para enviar el formulario.');
            return res.redirect('/contacto');
        }

        try {
            let contact = await this.contactsModel.findContactByEmail(email);
            let contactId: number;

            if (contact) {
                contactId = contact.id;
            } else {
                contactId = await this.contactsModel.addContact(name, email, country, clientIp);
                // Buscar el contacto recién creado para obtener todos los datos
                contact = await this.contactsModel.findContactByEmail(email);
            }

            await this.contactsModel.addMessage(contactId, message);

            await this.mailerService.sendContactConfirmation(
                name,
                email,
                message,
                country,
                clientIp,
                true,
                contact?.id,         // userId
                contact?.created_at  // createdAt
            );

            req.flash('success', contactId
                ? '¡Mensaje recibido! Ya tenías un contacto registrado, tu mensaje fue guardado.'
                : '¡Gracias por tu mensaje! Te hemos registrado como nuevo contacto.');

            res.redirect('/contacto');
        } catch (err) {
            req.flash('error', 'Hubo un error interno al enviar tu mensaje. Por favor, intenta de nuevo más tarde.');
            res.redirect('/contacto');
        }
    }

    // Renderiza la lista de todos los contactos
    async getAllContacts(req: Request, res: Response): Promise<void> {
        try {
            const allContacts = await this.contactsModel.getAllContacts();
            res.render('admin/contacts', {
                pageTitle: 'Todos los Contactos',
                contacts: allContacts
            });
        } catch (err) {
            req.flash('error', 'Hubo un error al obtener los contactos. Por favor, intenta de nuevo más tarde.');
            res.redirect('/admin');
        }
    }

    // Renderiza mensajes filtrados por estado
    async getMessagesByStatus(req: Request, res: Response): Promise<void> {
        const { status } = req.params;

        try {
            const messages = await this.contactsModel.getMessagesByStatus(status);
            res.render('admin/messages', {
                pageTitle: `Mensajes ${status}`,
                messages
            });
        } catch (err) {
            req.flash('error', 'Hubo un error al obtener los mensajes. Por favor, intenta de nuevo más tarde.');
            res.redirect('/admin');
        }
    }

    // Renderiza el detalle de un mensaje específico
    async getMessageById(req: Request, res: Response): Promise<void> {
        const { messageId } = req.params;

        try {
            const message = await this.contactsModel.getMessageById(Number(messageId));
            res.render('admin/messageDetail', {
                pageTitle: 'Detalle del Mensaje',
                message
            });
        } catch (err) {
            req.flash('error', 'Hubo un error al obtener el mensaje. Por favor, intenta de nuevo más tarde.');
            res.redirect('/admin');
        }
    }

    // Actualiza el estado de un mensaje al responder
    async replyToMessage(req: Request, res: Response): Promise<void> {
        const { messageId, replyContent } = req.body;
        const adminName = req.user?.name ?? 'Administrador';

        try {
            if (!messageId || isNaN(Number(messageId))) {
                req.flash('error', 'ID de mensaje inválido.');
                return res.redirect('/admin');
            }
            await this.contactsModel.updateMessageReplyStatus(
                Number(messageId),
                replyContent ?? '',
                adminName
            );

            req.flash('success', 'Respuesta enviada correctamente.');
            res.redirect('/admin');
        } catch (err) {
            req.flash('error', 'Hubo un error al enviar la respuesta. Por favor, intenta de nuevo más tarde.');
            res.redirect('/admin');
        }
    }
}

export default ContactController;
