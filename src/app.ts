

import express, { Request, Response, Application } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import session from 'express-session';
import flash from 'connect-flash';
import dotenv from 'dotenv';
dotenv.config();


import ContactsController from './controllers/ContactsController';
import ContactsModel from './models/ContactsModel';
import PaymentController from './controllers/PaymentController';

import MailerService from './services/MailerService';

const app: Application = express();
app.set('trust proxy', true);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules/bootstrap/dist')));
app.use('/bootstrap-icons', express.static(path.join(__dirname, '../node_modules/bootstrap-icons/font')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'tu-cadena-secreta-cambiala-en-produccion-12345abc', 
    resave: false, 
    saveUninitialized: true 
}));
app.use(express.urlencoded({ extended: true })); // Para formularios HTML estándar (application/x-www-form-urlencoded)
app.use(express.json());
app.use(flash());

const db = new sqlite3.Database('./database.db', (err: Error | null) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');

        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, '../views'));
        console.log('EJS Views Directory configured as:', app.get('views'));

        const contactsModel = new ContactsModel(db);
        const mailerService = new MailerService();
        const contactsController = new ContactsController(contactsModel, mailerService);
        const paymentController = new PaymentController();

        app.get('/', (req: Request, res: Response) => { res.render('index', { pageTitle: 'Inicio Ciclexpress' }); });
        app.get('/servicios', (req: Request, res: Response) => { res.render('servicios', { pageTitle: 'Servicios Ciclexpress' }); });
        app.get('/informacion', (req: Request, res: Response) => { res.render('informacion', { pageTitle: 'Sobre Ciclexpress' }); });

        app.get('/contacto', contactsController.showContactForm); 

        app.post('/contact/add', contactsController.add); 
        app.get('/admin/contacts', contactsController.index); 

        app.get('/payment', paymentController.showPaymentForm); // << NUEVO
        app.post('/payment/add', paymentController.add);       // << NUEVO

        // Manejo de errores 404
        app.use((req: Request, res: Response) => {
            res.status(404).render('error', { pageTitle: 'Página no encontrada', message: 'Lo sentimos, la página que buscas no existe.' });
        });






        app.listen(port, () => {
            console.log(`Servidor corriendo en http://localhost:${port}`);
            console.log('Presiona Ctrl+C para detener el servidor');
        });
    }
});