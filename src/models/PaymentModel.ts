// src/models/PaymentModel.ts

import sqlite3 from 'sqlite3';

class PaymentModel {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
        // createTable se llamará desde db.ts
    }

    /**
     * Crea la tabla 'payments' si no existe.
     * Este es un placeholder; adapta el esquema según tus necesidades reales de pago.
     */
    createTable(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transactionId TEXT UNIQUE, -- El ID de la transacción de la pasarela
                    userId INTEGER, -- Referencia a un usuario si tuvieras tabla de usuarios (puede ser NULL)
                    amount REAL,
                    currency TEXT,
                    status TEXT, -- Estado del pago real (ej. 'succeeded', 'failed')
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    buyerEmail TEXT,
                    description TEXT,
                    apiResponse TEXT -- Opcional: guardar la respuesta completa de la API
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

    /**
     * Añade un registro de pago a la base de datos.
     * Adapta los parámetros según tu esquema de tabla 'payments'.
     */
    async addPaymentRecord(transactionId: string, amount: number, currency: string, status: string, buyerEmail: string | null, description: string | null): Promise<void> {
        return new Promise((resolve, reject) => {
            // Ajusta la sentencia INSERT para que coincida con las columnas de tu tabla 'payments'
            // Asegúrate de que el número de placeholders (?) coincida con el número de valores pasados.
            this.db.run(
                'INSERT INTO payments (transactionId, amount, currency, status, buyerEmail, description) VALUES (?, ?, ?, ?, ?, ?)',
                [transactionId, amount, currency, status, buyerEmail, description],
                function(err) { // Usamos 'function' para acceder a 'this.lastID'
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

    /**
     * Obtiene un registro de pago por su ID interno de la base de datos.
     * @param id El ID interno del registro de pago.
     * @returns Promise<any | undefined> El registro de pago si se encuentra, o undefined.
     */
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
                        // row será undefined si no se encuentra ningún registro
                        resolve(row);
                    }
                }
            );
        });
    }

    /**
     * Obtiene todos los registros de pago de la base de datos.
     * @returns Promise<any[]> Un array de registros de pago, ordenados por fecha descendente.
     */
    async getAllPayments(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT id, transactionId, userId, amount, currency, status, timestamp, buyerEmail, description, apiResponse FROM payments ORDER BY timestamp DESC',
                [], // No necesitamos parámetros para seleccionar todos
                (err, rows) => {
                    if (err) {
                        console.error('Error al obtener todos los pagos:', err.message);
                        reject(err);
                    } else {
                        // rows será un array vacío si no hay pagos
                        resolve(rows);
                    }
                }
            );
        });
    }


    /**
     * Obtiene todos los registros de pago asociados a un ID de usuario.
     * @param userId El ID del usuario.
     * @returns Promise<any[]> Un array de registros de pago.
     */
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

    /**
     * Actualiza el estado de un registro de pago basado en su ID de transacción.
     * @param transactionId El ID de transacción de la pasarela de pago.
     * @param status El nuevo estado del pago (ej. 'completed', 'failed', 'refunded').
     * @returns Promise<void>
     */
    async updatePaymentStatus(transactionId: string, status: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE payments SET status = ? WHERE transactionId = ?',
                [status, transactionId],
                function(err) { // Usamos 'function' para acceder a 'this.changes'
                    if (err) {
                        console.error(`Error al actualizar estado del pago con Transacción ID ${transactionId}:`, err.message);
                        reject(err);
                    } else if (this.changes === 0) {
                         console.warn(`Pago con Transacción ID ${transactionId} no encontrado para actualizar estado.`);
                         // Opcional: rechazar la promesa si el pago no fue encontrado
                         // reject(new Error(`Pago con Transacción ID ${transactionId} no encontrado para actualizar.`));
                         resolve(); // O resolver si no es un error crítico que no se haya actualizado
                    }
                    else {
                        console.log(`Estado del pago con Transacción ID ${transactionId} actualizado a "${status}".`);
                        resolve();
                    }
                }
            );
        });
    }
}

export default PaymentModel;
