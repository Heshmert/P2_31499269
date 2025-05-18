// src/app.ts

import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, Application } from 'express'; 
import path from 'path';
import session from 'express-session';
import flash from 'connect-flash';``
import { db, initTables } from './db';

// Importa tus modelos, servicios y controladores
import ContactsModel from './models/ContactsModel';
import PaymentModel from './models/PaymentModel';
import MailerService from './services/MailerService';
import AdminController from './controllers/AdminController';
import PaymentController from './controllers/PaymentController';
import ContactController from './controllers/ContactController';
import RecaptchaService from './services/RecaptchaService';


console.log('--- app.ts: dotenv.config() ejecutado ---');
console.log('Contenido de process.env.FAKE_PAYMENT_API_KEY en app.ts (después de dotenv.config()):', process.env.FAKE_PAYMENT_API_KEY ? 'Configurada' : 'NO Configurada');
console.log('Contenido de process.env.RECAPTCHA_SITE_KEY en app.ts:', process.env.RECAPTCHA_SITE_KEY ? 'Configurada' : 'NO Configurada');
console.log('Contenido de process.env.RECAPTCHA_SECRET_KEY en app.ts:', process.env.RECAPTCHA_SECRET_KEY ? 'Configurada' : 'NO Configurada');


const app: Application = express(); 
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SESSION_SECRET || 'supersecreta_default_key';


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules/bootstrap/dist')));
app.use('/bootstrap-icons', express.static(path.join(__dirname, '../node_modules/bootstrap-icons/font')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(flash());

// Middleware para hacer los mensajes flash accesibles en las vistas
app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    res.locals.paymentSuccess = req.flash('paymentSuccess');
    res.locals.paymentError = req.flash('paymentError');
    res.locals.replySuccess = req.flash('replySuccess');
    res.locals.replyError = req.flash('replyError');
    res.locals.replyWarning = req.flash('replyWarning');
    res.locals.unsentReplyMessage = req.flash('unsentReplyMessage');
    // Pasa también la clave de sitio de reCAPTCHA para la vista de contacto
     res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
    next();
});
app.set('trust proxy', true);

const contactsModel = new ContactsModel(db);
const paymentModel = new PaymentModel(db);
console.log('paymentModel:', paymentModel);

const mailerService = new MailerService();
// --- Instancia RecaptchaService ---
const recaptchaService = new RecaptchaService();

// Instanciar Controladores
// --- Pasa todas las dependencias necesarias a cada controlador ---
const contactController = new ContactController(contactsModel, mailerService, recaptchaService);
const adminController = new AdminController(contactsModel, mailerService, paymentModel);
const paymentController = new PaymentController(mailerService, paymentModel);


// Hazlo async para esperar a que las tablas se creen antes de iniciar el servidor
async function startApp() {
    try {
        // Espera a que las tablas se creen o verifiquen
        await initTables(); // Llama a initTables sin pasar 'db', ya lo usa desde su módulo
        console.log('Tablas de base de datos inicializadas.');

        const server = app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

        process.on('SIGINT', () => {
            console.log('Recibida señal SIGINT. Cerrando...');
            server.close(() => { // Cierra el servidor Express primero
                console.log('Servidor HTTP cerrado.');
                db.close((err) => { // Luego cierra la conexión a la DB importada
                    if (err) {
                        console.error('Error cerrando la base de datos:', err.message);
                    }
                    console.log('Conexión a la base de datos cerrada.');
                    process.exit(0); // Salir del proceso
                });
            });
        });

    } catch (err) {
        console.error('Error critico durante la inicialización de la aplicación:', err);
        process.exit(1);
    }
}

// Inicia la aplicación llamando a la función asíncrona
startApp();


app.get('/', (req: Request, res: Response) => { res.render('index', { pageTitle: 'Inicio Ciclexpress' }); });
app.get('/servicios', (req: Request, res: Response) => { res.render('servicios', { pageTitle: 'Servicios Ciclexpress' }); });
app.get('/informacion', (req: Request, res: Response) => { res.render('informacion', { pageTitle: 'Sobre Ciclexpress' }); });

app.get('/contacto', contactController.showContactForm);
app.post('/contacto', contactController.add);

app.get('/payment', paymentController.showPaymentForm); // Usa paymentController
app.post('/payment', paymentController.add);
           // Usa paymentController

app.get('/admin', adminController.showAdminDashboard);
// Las rutas anteriores ahora redirigen a la principal
app.get('/admin/contacts', (req, res) => res.redirect('/admin'));
app.get('/admin/replies', (req, res) => res.redirect('/admin'));
app.get('/admin/payments', (req, res) => res.redirect('/admin'));
app.get('/admin/replied', (req, res) => res.redirect('/admin')); // Si tenías esta ruta

// Esta ruta para el formulario de respuesta probablemente seguirá siendo una página completa
// Esta ruta POST para enviar la respuesta también seguirá siendo un POST normal
app.post('/admin/replies/send/:contactId', adminController.sendReply);



app.use((req, res) => {
    res.status(404).render('404', { pageTitle: 'Página no encontrada' });
});
