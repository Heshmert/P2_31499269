// src/controllers/AdminController.ts

import { Request, Response } from 'express';
import ContactsModel from '../models/ContactsModel';
import MailerService from '../services/MailerService';
import PaymentModel from '../models/PaymentModel'; // Asegúrate de importar PaymentModel
// Asumimos que AdminController no necesita RecaptchaService
// import RecaptchaService from '../services/RecaptchaService';


class AdminController {
    private contactsModel: ContactsModel;
    private mailerService: MailerService;
    private paymentModel: PaymentModel; // Declara la propiedad PaymentModel
    // private recaptchaService: RecaptchaService; // Si no lo usas aquí, no lo declares

    // Constructor que recibe las dependencias
    constructor(contactsModel: ContactsModel, mailerService: MailerService, paymentModel: PaymentModel /*, recaptchaService: RecaptchaService*/) {
        this.contactsModel = contactsModel;
        this.mailerService = mailerService;
        this.paymentModel = paymentModel; // Asigna PaymentModel
        // this.recaptchaService = recaptchaService; // Si no lo usas aquí, no lo asignes

        // Atar (bind) los métodos
        this.showContactList = this.showContactList.bind(this);
        this.showPendingReplies = this.showPendingReplies.bind(this); // Mantener si tienes una vista de formulario dedicada
        this.sendReply = this.sendReply.bind(this);
        this.showPaymentList = this.showPaymentList.bind(this);
        this.showAdminDashboard = this.showAdminDashboard.bind(this); // Método principal
        this.showRepliedMessages = this.showRepliedMessages.bind(this); // Método para mensajes respondidos (redirige)
    }

    // --- Método principal para renderizar la vista del panel con todos los datos ---
    async showAdminDashboard(req: Request, res: Response): Promise<void> {
        console.log('AdminController - showAdminDashboard: Ejecutando GET /admin.');
        try {
            // Obtener TODOS los datos necesarios para todas las secciones
            const allContacts = await this.contactsModel.getAllContacts(); // Obtiene todos los contactos
            const pendingContacts = await this.contactsModel.getAllContacts('Pending'); // Obtiene solo pendientes
            const repliedContacts = await this.contactsModel.getAllContacts('Respondido'); // Obtiene solo respondidos
            const payments = await this.paymentModel.getAllPayments(); // Obtiene todos los pagos


            // --- DEBUG: Log the fetched data counts ---
            console.log('AdminController - showAdminDashboard: Fetched allContacts count:', allContacts.length);
            console.log('AdminController - showAdminDashboard: Fetched pendingContacts count:', pendingContacts.length);
            console.log('AdminController - showAdminDashboard: Fetched repliedContacts count:', repliedContacts.length);
            console.log('AdminController - showAdminDashboard: Fetched payments count:', payments.length);
            // ------------------------------------


            // Renderizar la vista principal de administración y pasar TODOS los datos
            res.render('administracion', {
                pageTitle: 'Panel de Administración',
                // Pasa todos los datos que las secciones en administracion.ejs necesitan
                allContacts: allContacts,
                pendingContacts: pendingContacts,
                repliedContacts: repliedContacts, // Pasa los mensajes respondidos
                payments: payments,
                // Pasa también los mensajes flash
                replySuccess: req.flash('replySuccess'),
                replyError: req.flash('replyError'),
                replyWarning: req.flash('replyWarning'),
                successMessage: req.flash('success'),
                errorMessage: req.flash('error'),
                paymentSuccess: req.flash('paymentSuccess'),
                paymentError: req.flash('paymentError'),
            });

        } catch (error) {
             console.error('Error al cargar datos para el panel de administración:', error);
             // En caso de error, renderiza la vista con listas vacías y un mensaje de error flash
             req.flash('error', 'Error al cargar los datos del panel de administración.');
             res.render('administracion', {
                pageTitle: 'Panel de Administración',
                allContacts: [], // Pasa arrays vacíos en caso de error
                pendingContacts: [],
                repliedContacts: [],
                payments: [],
                successMessage: req.flash('success'),
                errorMessage: req.flash('error'), // Pasa el mensaje de error flash
                replySuccess: req.flash('replySuccess'),
                replyError: req.flash('replyError'),
                replyWarning: req.flash('replyWarning'),
                paymentSuccess: req.flash('paymentSuccess'),
                paymentError: req.flash('paymentError'),
             });
        }
    }


    // --- Métodos de lista que ahora REDIRIGEN al panel principal ---
    showContactList(req: Request, res: Response): void {
        console.log('AdminController - showContactList: Ejecutando GET /admin/contacts (Redirigiendo).');
        res.redirect('/admin'); // Redirige a la ruta principal del panel
    }

    showPendingReplies(req: Request, res: Response): void {
        console.log('AdminController - showPendingReplies: Ejecutando GET /admin/replies (Redirigiendo).');
        res.redirect('/admin'); // Redirige a la ruta principal del panel
    }

     showPaymentList(req: Request, res: Response): void {
        console.log('AdminController - showPaymentList: Ejecutando GET /admin/payments (Redirigiendo).');
        res.redirect('/admin'); // Redirige a la ruta principal del panel
    }

    showRepliedMessages(req: Request, res: Response): void {
        console.log('AdminController - showRepliedMessages: Ejecutando GET /admin/replied (Redirigiendo).');
        res.redirect('/admin'); // Redirige a la ruta principal del panel
    }


    // --- Método para mostrar el formulario de respuesta (si usas una página dedicada) ---
    // Mantenlo si tienes views/admin/reply-form.ejs. Si solo usas el modal, puedes eliminarlo.
 

    // --- Método para manejar el envío del formulario de respuesta (POST) ---
    // Este método sigue siendo necesario para procesar el formulario del modal.
    async sendReply(req: Request, res: Response): Promise<void> {
        const contactId = parseInt(req.params.contactId);

        const { replySubject, replyContent } = req.body; // Asegúrate de obtener ambos campos

        console.log(`AdminController - sendReply: Ejecutando POST /admin/replies/send/${contactId}.`);

        if (isNaN(contactId)) {
            console.warn('AdminController - sendReply: ID de contacto inválido.');
            req.flash('replyError', 'ID de contacto inválido para enviar respuesta.');
            return res.redirect('/admin'); // Redirige al panel principal
        }
        if (!replyContent || replyContent.trim() === '') {
            console.warn('AdminController - sendReply: El mensaje de respuesta está vacío.');
            req.flash('replyError', 'El mensaje de respuesta no puede estar vacío.');
            return res.redirect('/admin'); // Redirige al panel principal
        }

        try {
            const contact = await this.contactsModel.getContactById(contactId);

            if (!contact) {
                 console.warn(`AdminController - sendReply: Contacto con ID ${contactId} no encontrado.`);
                 req.flash('replyError', `Contacto con ID ${contactId} no encontrado para enviar respuesta.`);
                 return res.redirect('/admin'); // Redirige al panel principal
            }
            if (contact.status !== 'Pending') {
                 console.warn(`AdminController - sendReply: Mensaje con ID ${contactId} ya respondido.`);
                 req.flash('replyWarning', `El mensaje de ${contact.name} (ID: ${contactId}) ya ha sido respondido.`);
                 return res.redirect('/admin'); // Redirige al panel principal
            }

            const adminName = 'Admin'; // O el nombre que uses
            // Asegúrate de que sendContactReply en MailerService pueda manejar el asunto
            await this.mailerService.sendContactReply(contact.email, contact.message, replyContent, adminName);
            console.log(`Respuesta enviada por correo al usuario ${contact.email}.`);

            await this.contactsModel.updateContactReplyStatus(contactId, replyContent, adminName);
            console.log(`Estado del contacto ${contactId} actualizado a 'Respondido'.`);

            // --- Siempre redirige a la página principal del panel después de un envío exitoso ---
            console.log('AdminController - sendReply: Procesamiento exitoso. Redirigiendo a /admin.');
            req.flash('replySuccess', `Respuesta enviada exitosamente a ${contact.name}.`);
            res.redirect('/admin'); // Redirige al panel principal
        } catch (error) {
             console.error(`AdminController - sendReply: Error al enviar respuesta o actualizar contacto ${contactId}:`, error);
             req.flash('replyError', `Error al enviar la respuesta para el mensaje con ID ${contactId}.`);
             res.redirect('/admin'); // Redirige al panel principal
        }
    }

    // Asegúrate de exportar la clase al final
}

export default AdminController;
