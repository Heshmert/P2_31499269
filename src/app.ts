// src/app.ts
import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, Application } from 'express'; 
import path from 'path';
import session from 'express-session';
import flash from 'connect-flash';
import { db, initTables } from './db';
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
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        maxAge: 15 * 60 * 1000 }
}));
app.use(flash());

configurePassport(app);

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user; 
    res.locals.success = req.flash('success'); 
    res.locals.error = req.flash('error');  
    next();
});

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


async function startApp() {
    try {
        await initTables(); 
        console.log('Tablas de base de datos inicializadas.');

        const server = app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });

        process.on('SIGINT', () => {
            console.log('Recibida señal SIGINT. Cerrando...');
            server.close(() => { 
                console.log('Servidor HTTP cerrado.');
                db.close((err) => { 
                    if (err) {
                        console.error('Error cerrando la base de datos:', err.message);
                    }
                    console.log('Conexión a la base de datos cerrada.');
                    process.exit(0); 
                });
            });
        });

    } catch (err) {
        console.error('Error critico durante la inicialización de la aplicación:', err);
        process.exit(1);
    }
}

startApp();
    app.get('/login', authController.showLoginPage);
    app.post('/login', authController.handleLogin);
    app.get('/logout', authController.handleLogout);
    app.get('/register', authController.isAdmin, authController.showRegisterPage); 
    app.post('/register', authController.isAdmin, authController.handleRegister); 
    app.get('/auth/google', (req, res, next) => {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            prompt: 'select_account'
        })(req, res, next);
    });
    app.get('/auth/google/callback',
        passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
        (req, res) => {
            res.redirect('/admin');
        }
    );

function ensureAuthenticated(req: Request, res: Response, next: Function) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}
app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: 'Ciclexpress',
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        ogTitle: 'Ciclexpress - Taller de bicicletas y patinetas',
        ogDescription: 'Ciclexpress, taller de bicicletas y patinetas eléctricas.',
        ogUrl: 'https://p2-31499269.onrender.com',
        ogImage: ''
    });
});
app.get('/servicios', (req: Request, res: Response) => {
    res.render('servicios', {
        pageTitle: 'Servicios Ciclexpress',
        ogTitle: 'Servicios - Ciclexpress',
        ogDescription: 'Conoce todos los servicios de reparación y mantenimiento de Ciclexpress.',
        ogUrl: 'https://p2-31499269.onrender.com/servicios',
        ogImage: ''
    });
});
app.get('/informacion', (req: Request, res: Response) => {
    res.render('informacion', {
        pageTitle: 'Sobre Ciclexpress',
        ogTitle: 'Sobre Nosotros - Ciclexpress',
        ogDescription: 'Información sobre Ciclexpress, tu taller de confianza.',
        ogUrl: 'https://p2-31499269.onrender.com/informacion',
        ogImage: ''
    });
});
app.get('/contacto', contactController.showContactForm);
app.post('/contacto', contactController.add);
app.get('/payment', paymentController.showPaymentForm);
app.post('/payment', paymentController.add);
app.get('/admin', ensureAuthenticated, adminController.showAdminDashboard);
app.post('/admin/replies/send/:messageId', ensureAuthenticated, adminController.sendReply);
app.use((req, res) => {
    res.status(404).render('404', { pageTitle: 'Página no encontrada' });
});
