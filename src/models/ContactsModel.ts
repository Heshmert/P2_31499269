// src/models/ContactsModel.ts

import * as sqlite3 from 'sqlite3';

// ===========================================================
// CAMBIO IMPORTANTE 1: Renombrado 'comment' a 'message' para coincidir con el controlador
// ===========================================================
export interface ContactData { 
    name: string;
    email: string;
    message: string; // ¡Cambiado de 'comment' a 'message'!
    clientIp?: string; 
    country?: string; 
}

export interface Contact extends ContactData { 
    id: number;
    created_at: string;
}

class ContactsModel { 
    private db: sqlite3.Database; 

    constructor(db: sqlite3.Database) {
        this.db = db;
        // Llamada a createTable al inicio, ahora la convertimos a Promise
        this.createTable().catch(err => console.error('Error en constructor al crear tabla:', err));
    }

    // ===========================================================
    // CAMBIO IMPORTANTE 2: createTable ahora devuelve una Promise
    // ===========================================================
    async createTable(): Promise<void> {
        return new Promise((resolve, reject) => {

            const sql = `CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT,    -- ¡Cambiado de 'comment' a 'message'!
                country TEXT,          -- Asegúrate de que estas líneas estén aquí
                clientIp TEXT, 
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`;
            this.db.run(sql, (err: Error | null) => {
                if (err) {
                    console.error('ERROR al crear tabla contacts:', err.message); 
                    return reject(err);
                }
                console.log('Tabla contacts lista o ya existía.'); 
                resolve();
            });
        });
    }

    async addContact(name: string, email: string, message: string, country: string, clientIp?: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO contacts (name, email, message, clientIp, country, created_at)
                         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`; // Usar CURRENT_TIMESTAMP de SQLite

            const params = [
                name,
                email,
                message, // 'message' ahora corresponde al campo de la DB
                clientIp || null, // clientIp puede ser nulo
                country || null     // country puede ser nulo si no se obtiene
            ];

            console.log('ContactsModel - addContact: Parámetros para insertar:', params);

            this.db.run(sql, params, function(this: sqlite3.RunResult, err: Error | null) {
                if (err) {
                    console.error('Error al insertar contacto:', err.message);
                    return reject(err);
                }
                resolve(this.lastID); // Resolvemos con el ID del nuevo registro
            });
        });
    }

    async getAllContacts(): Promise<Contact[]> {
        return new Promise((resolve, reject) => {
            // Seleccionar todos los campos relevantes, incluyendo 'country' y 'message'
            const sql = `SELECT id, name, email, message, clientIp, country, created_at FROM contacts ORDER BY created_at DESC`;

            this.db.all(sql, [], (err: Error | null, rows: any[]) => { 
                if (err) {
                    console.error('Error al obtener todos los contactos:', err.message);
                    return reject(err);
                }
                resolve(rows as Contact[]);
            });
        });
    }

    // closeDb es opcional si ya lo manejas en app.ts, pero lo mantenemos consistente
    async closeDb(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err: Error | null) => {
                if (err) {
                    console.error('Error al cerrar la base de datos:', err.message);
                    return reject(err);
                }
                console.log('Conexión a la base de datos cerrada.');
                resolve();
            });
        });
    }
}

export default ContactsModel;