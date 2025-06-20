// src/app.ts

import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, Application } from 'express'; 
import path from 'path';
import session from 'express-session';
import flash from 'connect-flash';
import { db, initTables } from './db';

// Importa tus modelos, servicios y controladores
import ContactsModel from './models/ContactsModel';
import PaymentModel from './models/PaymentModel';
import MailerService from './services/MailerService';
import AdminController from './controllers/AdminController';
import PaymentController from './controllers/PaymentController';
import ContactController from './controllers/ContactController';
import RecaptchaService from './services/RecaptchaService';
import configurePassport from './config/passport';
import { AuthController } from './controllers/AuthController';
import passport from 'passport';

const app: Application = express(); 
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SESSION_SECRET || 'supersecreta_default_key';
const authController = new AuthController();

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
    cookie: { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true en HTTPS, false en HTTP (desarrollo)
        sameSite: 'lax', // Protege contra CSRF (ajusta a 'strict' si es necesario)
        maxAge: 15 * 60 * 1000 }
}));
app.use(flash());

configurePassport(app);

// Middleware para pasar el estado de autenticación y el usuario a todas las vistas
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user; // `req.user` es poblado por Passport
    res.locals.success = req.flash('success'); // Mensajes flash de éxito
    res.locals.error = req.flash('error');   // Mensajes flash de error
    next();
});

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
    res.locals.ogTitle = null;
    res.locals.ogDescription = null;
    res.locals.ogUrl = null;
    res.locals.ogImage = null;
    res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
    next();
});
app.set('trust proxy', true);

const paymentModel = new PaymentModel(db);
const mailerService = new MailerService();
const recaptchaService = new RecaptchaService();

const contactsModel = new ContactsModel(db);
const contactController = new ContactController(contactsModel, mailerService);
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

    app.get('/login', authController.showLoginPage);
    app.post('/login', authController.handleLogin);
    app.get('/logout', authController.handleLogout);

    app.get('/register', authController.isAdmin, authController.showRegisterPage); // Protegida por isAdmin
    app.post('/register', authController.isAdmin, authController.handleRegister); // Protegida por isAdmin

    // Rutas de Google OAuth
    app.get('/auth/google', (req, res, next) => {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            prompt: 'select_account' // Esto fuerza el selector de cuenta cada vez
        })(req, res, next);
    });

    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
        (req, res) => {
            res.redirect('/admin');
        }
    );

// Middleware para proteger rutas que requieren autenticación
function ensureAuthenticated(req: Request, res: Response, next: Function) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Rutas principales
app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: 'Ciclexpress',
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        ogTitle: 'Ciclexpress - Taller de bicicletas y patinetas',
        ogDescription: 'Ciclexpress, taller de bicicletas y patinetas eléctricas.',
        ogUrl: 'http://localhost:3000',
        ogImage: '/img/og-default.png'
    });
});

app.get('/servicios', (req: Request, res: Response) => {
    res.render('servicios', {
        pageTitle: 'Servicios Ciclexpress',
        ogTitle: 'Servicios - Ciclexpress',
        ogDescription: 'Conoce todos los servicios de reparación y mantenimiento de Ciclexpress.',
        ogUrl: 'http://localhost:3000/servicios',
        ogImage: '/img/og-servicios.png'
    });
});

app.get('/informacion', (req: Request, res: Response) => {
    res.render('informacion', {
        pageTitle: 'Sobre Ciclexpress',
        ogTitle: 'Sobre Nosotros - Ciclexpress',
        ogDescription: 'Información sobre Ciclexpress, tu taller de confianza.',
        ogUrl: 'http://localhost:3000/informacion',
        ogImage: '/img/og-info.png'
    });
});



app.get('/contacto', contactController.showContactForm);
app.post('/contacto', contactController.add);

app.get('/payment', paymentController.showPaymentForm);
app.post('/payment', paymentController.add);

app.get('/admin', ensureAuthenticated, adminController.showAdminDashboard);
app.post('/admin/replies/send/:messageId', ensureAuthenticated, adminController.sendReply);

// Página 404
app.use((req, res) => {
    res.status(404).render('404', { pageTitle: 'Página no encontrada' });
});
