// src/controllers/ContactController.ts

import { Request, Response } from 'express';
import ContactsModel from '../models/ContactsModel';

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

    constructor(contactsModel: ContactsModel) {
        this.contactsModel = contactsModel;
        this.add = this.add.bind(this);
        this.showContactForm = this.showContactForm.bind(this);
    }

    // Mostrar formulario de contacto
    showContactForm(req: Request, res: Response): void {
        res.render('contacto', {
            pageTitle: 'Contacto',
            successMessage: req.flash('success'),
            errorMessage: req.flash('error')
        });
    }

    // Procesar envío de contacto
    async add(req: Request, res: Response): Promise<void> {
        const { name, email, message } = req.body;
        const clientIp = req.ip || 'Desconocida';
        const country = 'Desconocido'; // Puedes obtenerlo por IP si lo deseas

        try {
            // Verifica si el contacto ya existe
            let contact = await this.contactsModel.findContactByEmail(email);
            let contactId: number;

            if (contact) {
                contactId = contact.id;
            } else {
                contactId = await this.contactsModel.addContact(name, email, country, clientIp);
            }

            // Guarda el mensaje asociado al contacto
            await this.contactsModel.addMessage(contactId, message);

            req.flash('success', contact
                ? '¡Mensaje recibido! Ya tenías un contacto registrado, tu mensaje fue guardado.'
                : '¡Gracias por tu mensaje! Te hemos registrado como nuevo contacto.');

            res.redirect('/contacto');
        } catch (err) {
            console.error('Error al guardar contacto/mensaje:', err);
            req.flash('error', 'Hubo un error interno al enviar tu mensaje. Por favor, intenta de nuevo más tarde.');
            res.redirect('/contacto');
        }
    }

    // Obtener todos los contactos
    async getAllContacts(req: Request, res: Response): Promise<void> {
        try {
            const allContacts = await this.contactsModel.getAllContacts();
            res.render('admin/contacts', {
                pageTitle: 'Todos los Contactos',
                contacts: allContacts
            });
        } catch (err) {
            console.error('Error al obtener contactos:', err);
            req.flash('error', 'Hubo un error al obtener los contactos. Por favor, intenta de nuevo más tarde.');
            res.redirect('/admin');
        }
    }

    // Obtener mensajes por estado
    async getMessagesByStatus(req: Request, res: Response): Promise<void> {
        const { status } = req.params;

        try {
            const messages = await this.contactsModel.getMessagesByStatus(status);
            res.render('admin/messages', {
                pageTitle: `Mensajes ${status}`,
                messages
            });
        } catch (err) {
            console.error('Error al obtener mensajes:', err);
            req.flash('error', 'Hubo un error al obtener los mensajes. Por favor, intenta de nuevo más tarde.');
            res.redirect('/admin');
        }
    }

    // Obtener un mensaje específico
    async getMessageById(req: Request, res: Response): Promise<void> {
        const { messageId } = req.params;

        try {
            const message = await this.contactsModel.getMessageById(Number(messageId));
            res.render('admin/messageDetail', {
                pageTitle: 'Detalle del Mensaje',
                message
            });
        } catch (err) {
            console.error('Error al obtener el mensaje:', err);
            req.flash('error', 'Hubo un error al obtener el mensaje. Por favor, intenta de nuevo más tarde.');
            res.redirect('/admin');
        }
    }

    // Responder un mensaje
    async replyToMessage(req: Request, res: Response): Promise<void> {
        const { messageId, replyContent } = req.body;
        const adminName = req.user?.name ?? 'Administrador';

        try {
            // Validar y convertir messageId a número
            if (!messageId || isNaN(Number(messageId))) {
                req.flash('error', 'ID de mensaje inválido.');
                return res.redirect('/admin');
            }
            // Actualizar estado de un mensaje al responder
            await this.contactsModel.updateMessageReplyStatus(
                Number(messageId),
                replyContent ?? '',
                adminName
            );

            req.flash('success', 'Respuesta enviada correctamente.');
            res.redirect('/admin');
        } catch (err) {
            console.error('Error al responder el mensaje:', err);
            req.flash('error', 'Hubo un error al enviar la respuesta. Por favor, intenta de nuevo más tarde.');
            res.redirect('/admin');
        }
    }
}

export default ContactController;
