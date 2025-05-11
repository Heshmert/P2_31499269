import { Request, Response, RequestHandler } from 'express';
import ContactsModel, { ContactData, Contact } from '../models/ContactsModel';

class ContactsController { 
    private contactsModel: ContactsModel;

    constructor(contactsModel: ContactsModel) {
        this.contactsModel = contactsModel;
        this.add = this.add.bind(this);
        this.index = this.index.bind(this);
        this.showContactForm = this.showContactForm.bind(this); 
    }

    showContactForm(req: Request, res: Response): void {
        const successMessages = req.flash('success'); 
        const errorMessages = req.flash('error');   

        res.render('contacto', {
            pageTitle: 'Contacto Ciclexpress',
            successMessage: successMessages.length > 0 ? successMessages[0] : null, 
            errorMessage: errorMessages.length > 0 ? errorMessages[0] : null  
        });
    }
    add(req: Request, res: Response): void {
        const { name, email, comment } = req.body;
        const ipAddress = req.ip;

        if (!name || !email || !comment) {
             req.flash('error', 'Error: Faltan campos obligatorios.');
             res.redirect('/contacto'); 
             return; 
        }

        const contactData: ContactData = {
            name: name,
            email: email,
            comment: comment,
            ip_address: ipAddress
        };

        this.contactsModel.addContact(contactData, (err: Error | null, contactId?: number) => {
            if (err) {
                console.error('Error al insertar contacto:', err.message);
                req.flash('error', 'Hubo un error al guardar tu mensaje. Intenta de nuevo.');
            } else {
                console.log(`Contacto guardado con ID: ${contactId}, IP: ${ipAddress}`);
                req.flash('success', '¡Tu mensaje ha sido enviado con éxito!');
            }
            res.redirect('/contacto');
        });
    }

    index(req: Request, res: Response): void {
         this.contactsModel.getAllContacts((err: Error | null, contacts?: Contact[]) => {
             if (err) {
                 console.error('Error al obtener contactos:', err.message);
                 res.status(500).render('error', { pageTitle: 'Error', message: 'Error al cargar los contactos.' });
             } else {
                 res.render('admin/contacts', { pageTitle: 'Administración de Contactos', contacts: contacts });
             }
         });
    }
}

export default ContactsController; 