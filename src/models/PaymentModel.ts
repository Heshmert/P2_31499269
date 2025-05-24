// src/models/PaymentModel.ts

import sqlite3 from 'sqlite3';

class PaymentModel {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    // Crea la tabla 'payments' si no existe
    createTable(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transactionId TEXT UNIQUE,
                    userId INTEGER,
                    amount REAL,
                    currency TEXT,
                    status TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    buyerEmail TEXT,
                    description TEXT,
                    apiResponse TEXT
                )
            `, (err) => {
                if (err) {
                    console.error('Error al crear la tabla payments:', err.message);
                    reject(err);
                } else {
                    console.log('Tabla payments lista o ya existía.');
                    resolve();
                }
            });
        });
    }

    // Añade un registro de pago
    async addPaymentRecord(transactionId: string, amount: number, currency: string, status: string, buyerEmail: string | null, description: string | null): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO payments (transactionId, amount, currency, status, buyerEmail, description) VALUES (?, ?, ?, ?, ?, ?)',
                [transactionId, amount, currency, status, buyerEmail, description],
                function(err) {
                    if (err) {
                        console.error('Error al insertar registro de pago:', err.message);
                        reject(err);
                    } else {
                        console.log(`Registro de pago insertado con ID: ${this.lastID}, Transacción ID: ${transactionId}`);
                        resolve();
                    }
                }
            );
        });
    }

    // Obtiene un registro de pago por ID interno
    async getPaymentById(id: number): Promise<any | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT id, transactionId, userId, amount, currency, status, timestamp, buyerEmail, description, apiResponse FROM payments WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error(`Error al obtener pago por ID ${id}:`, err.message);
                        reject(err);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }

    // Obtiene todos los registros de pago
    async getAllPayments(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT id, transactionId, userId, amount, currency, status, timestamp, buyerEmail, description, apiResponse FROM payments ORDER BY timestamp DESC',
                [],
                (err, rows) => {
                    if (err) {
                        console.error('Error al obtener todos los pagos:', err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    // Obtiene todos los pagos asociados a un usuario
    async getPaymentsByUserId(userId: number): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT id, transactionId, userId, amount, currency, status, timestamp, buyerEmail, description, apiResponse FROM payments WHERE userId = ? ORDER BY timestamp DESC',
                [userId],
                (err, rows) => {
                    if (err) {
                        console.error(`Error al obtener pagos por User ID ${userId}:`, err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    // Actualiza el estado de un pago por transactionId
    async updatePaymentStatus(transactionId: string, status: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE payments SET status = ? WHERE transactionId = ?',
                [status, transactionId],
                function(err) {
                    if (err) {
                        console.error(`Error al actualizar estado del pago con Transacción ID ${transactionId}:`, err.message);
                        reject(err);
                    } else if (this.changes === 0) {
                        console.warn(`Pago con Transacción ID ${transactionId} no encontrado para actualizar estado.`);
                        resolve();
                    } else {
                        console.log(`Estado del pago con Transacción ID ${transactionId} actualizado a "${status}".`);
                        resolve();
                    }
                }
            );
        });
    }
}

export default PaymentModel;
