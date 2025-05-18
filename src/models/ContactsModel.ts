// src/models/ContactsModel.ts

import sqlite3 from 'sqlite3';

class ContactsModel {
    private db: sqlite3.Database;

    // Constructor solo recibe la conexión DB
    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    addContact(name: string, email: string, message: string, country: string, clientIp: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO contacts (name, email, message, country, clientIp) VALUES (?, ?, ?, ?, ?)',
                [name, email, message, country, clientIp],
                function(err) { // Usamos 'function' para acceder a 'this.lastID'
                    if (err) {
                        console.error('Error al insertar contacto:', err.message);
                        reject(err);
                    } else {
                        console.log(`Contacto insertado con ID: ${this.lastID}`);
                        resolve();
                    }
                }
            );
        });
    }

    getContactById(contactId: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT id, name, email, message, country, clientIp, timestamp, status, replyMessage, repliedAt, repliedBy FROM contacts WHERE id = ?',
                [contactId],
                (err, row) => {
                    if (err) {
                        console.error(`Error al obtener contacto por ID ${contactId}:`, err.message);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    getAllContacts(status?: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            let query = 'SELECT id, name, email, message, country, clientIp, timestamp, status, replyMessage, repliedAt, repliedBy FROM contacts';
            const params: any[] = [];

            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }

            query += ' ORDER BY timestamp DESC';

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Error al obtener contactos:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    updateContactReplyStatus(contactId: number, replyMessage: string, repliedBy: string = 'Admin'): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE contacts SET status = ?, replyMessage = ?, repliedAt = ?, repliedBy = ? WHERE id = ?',
                ['Respondido', replyMessage, new Date().toISOString(), repliedBy, contactId],
                function(err) { // Usamos 'function' si necesitamos 'this' (aunque aquí no)
                    if (err) {
                        console.error(`Error al actualizar contacto ${contactId} con respuesta:`, err.message);
                        reject(err);
                    } else if (this.changes === 0) {
                         console.warn(`Contacto ${contactId} no encontrado para actualizar respuesta.`);
                         resolve();
                    }
                    else {
                        console.log(`Contacto ${contactId} marcado como respondido.`);
                        resolve();
                    }
                }
            );
        });
    }

}

export default ContactsModel;