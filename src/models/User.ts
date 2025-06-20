import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { DB_PATH } from '../db';
const dbPath = DB_PATH;

export class User {
    id?: number;
    username: string;
    password_hash?: string;
    google_id?: string;
    created_at?: string;

    constructor(username: string, password_hash?: string, google_id?: string, id?: number, created_at?: string) {
        this.id = id;
        this.username = username;
        this.password_hash = password_hash;
        this.google_id = google_id;
        this.created_at = created_at;
    }

    static async findByUsername(username: string): Promise<User | undefined> {
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        const row = await db.get<User>('SELECT * FROM users WHERE username = ?', username);
        db.close();
        if (row) {
            return new User(row.username, row.password_hash, row.google_id, row.id, row.created_at);
        }
        return undefined;
    }

    static async findById(id: number): Promise<User | undefined> {
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        const row = await db.get<User>('SELECT * FROM users WHERE id = ?', id);
        db.close();
        if (row) {
            return new User(row.username, row.password_hash, row.google_id, row.id, row.created_at);
        }
        return undefined;
    }

    static async findOrCreateGoogleUser(profile: any): Promise<User> {
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        let user = await db.get<User>('SELECT * FROM users WHERE google_id = ?', profile.id);

        if (!user) {
            // Si el usuario de Google no existe, créalo
            const username = profile.displayName || profile.emails?.[0]?.value || `google_user_${profile.id}`;
            const result = await db.run(
                'INSERT INTO users (username, google_id) VALUES (?, ?)',
                username,
                profile.id
            );
            user = await db.get<User>('SELECT * FROM users WHERE id = ?', result.lastID);
        }
        db.close();
        if (user) {
            return new User(user.username, user.password_hash, user.google_id, user.id, user.created_at);
        }
        throw new Error('Error: No se pudo encontrar o crear el usuario de Google.');
    }

    static async createUser(username: string, password_raw: string): Promise<User | undefined> {
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        const password_hash = await bcrypt.hash(password_raw, 10); // Generar hash de la contraseña

        try {
            const result = await db.run(
                'INSERT INTO users (username, password_hash) VALUES (?, ?)',
                username,
                password_hash
            );
            const newUser = await db.get<User>('SELECT * FROM users WHERE id = ?', result.lastID);
            db.close();
            if (newUser) {
                return new User(newUser.username, newUser.password_hash, newUser.google_id, newUser.id, newUser.created_at);
            }
            return undefined;
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed: users.username')) {
                console.error(`Error: El nombre de usuario '${username}' ya existe.`);
                db.close();
                throw new Error('El nombre de usuario ya existe.');
            }
            console.error('Error al crear usuario:', error);
            db.close();
            throw error;
        }
    }

    async comparePassword(password_raw: string): Promise<boolean> {
        if (!this.password_hash) {
            return false; // El usuario no tiene una contraseña local (ej. usuario de Google)
        }
        return await bcrypt.compare(password_raw, this.password_hash);
    }
}
