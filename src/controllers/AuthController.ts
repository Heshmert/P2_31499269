import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '../models/User';

// Extender la interfaz Request de Express para incluir el usuario de Passport y flash
declare global {
    namespace Express {
        interface Request {
            user?: User;
            isAuthenticated(): boolean;
            isUnauthenticated(): boolean;
            logIn(user: User, callback: (err?: Error) => void): void;
            logOut(callback: (err?: Error) => void): void;
        }
    }
}


export class AuthController {

    showLoginPage(req: Request, res: Response) {
        res.render('login', {
            pageTitle: 'Login',
            error: req.flash('error')
        });
    }

    handleLogin(req: Request, res: Response, next: NextFunction) {
        passport.authenticate('local', (err: any, user: User, info: any) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash('error', info.message);
                return res.redirect('/login');
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                // Redirige a la página principal del panel si el login es exitoso
                return res.redirect('/admin');
            });
        })(req, res, next);
    }

    handleLogout(req: Request, res: Response, next: NextFunction) {
        req.logout((err) => {
            if (err) {
                return next(err);
            }
            // Destruye completamente la sesión
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error al destruir la sesión:', err);
                    return next(err);
                }
                // Limpia la cookie de sesión del navegador
                res.clearCookie('connect.sid');
                res.redirect('/login');
            });
        });
    }

    showRegisterPage(req: Request, res: Response) {
        res.render('register', {
            pageTitle: 'Registro de Usuario',
            error: req.flash('error')
        });
    }

    async handleRegister(req: Request, res: Response) {
        const { username, password } = req.body;
        if (!username || !password) {
            req.flash('error', 'Nombre de usuario y contraseña son requeridos.');
            return res.redirect('/register');
        }

        try {
            await User.createUser(username, password);
            req.flash('success', 'Usuario registrado exitosamente. Por favor, inicia sesión.');
            res.redirect('/login');
        } catch (error: any) {
            req.flash('error', error.message);
            res.redirect('/register');
        }
    }

    // Middleware para asegurar que solo usuarios autenticados puedan acceder a ciertas rutas
    isAuthenticated(req: Request, res: Response, next: NextFunction) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error', 'Por favor, inicia sesión para acceder.');
        res.redirect('/login');
    }

    isAdmin(req: Request, res: Response, next: NextFunction) {
        // Asumiendo que el usuario 'admin' es el único que puede registrar
        if (req.isAuthenticated() && (req.user as User).username === 'admin') {
             return next();
        }
        req.flash('error', 'Acceso no autorizado para registrar usuarios.');
        res.redirect('/login');
    }
}
