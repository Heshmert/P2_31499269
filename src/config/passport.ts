import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import dotenv from 'dotenv'; // Importa dotenv para cargar variables de entorno

dotenv.config(); // Asegúrate de que las variables de entorno estén cargadas aquí también para Passport

export default function configurePassport(app: any) {
    passport.use(new LocalStrategy(
        async (username, password, done) => {
            try {
                const user = await User.findByUsername(username);
                if (!user) {
                    return done(null, false, { message: 'Usuario incorrecto.' });
                }
                const isMatch = await user.comparePassword(password);
                if (!isMatch) {
                    return done(null, false, { message: 'Contraseña incorrecta.' });
                }
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.GOOGLE_CALLBACK_URL!,
            scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await User.findOrCreateGoogleUser(profile);
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    ));

    // Serialización: qué parte del usuario se guardará en la sesión
    passport.serializeUser((user: any, done) => {
        done(null, user.id); // Solo guarda el ID del usuario en la sesión
    });

    // Deserialización: cómo recuperar el usuario completo de la sesión usando el ID
    passport.deserializeUser(async (id: number, done) => {
        try {
            const user = await User.findById(id);
            done(null, user); // Adjunta el objeto usuario completo a req.user
        } catch (err) {
            done(err, null);
        }
    });

    // Inicializar Passport y las sesiones de Passport en la aplicación Express
    app.use(passport.initialize());
    app.use(passport.session());
}
