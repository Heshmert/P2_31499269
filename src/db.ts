// src/db.ts

import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs'; 
dotenv.config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'app.db');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
    console.log(`Directorio 'data' creado en ${dataDir}`);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error conectando a la base de datos SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite en', DB_PATH);
    }
});


function runAsync(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) { 
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

async function initTables(): Promise<void> {
    console.log('Iniciando creación/verificación de tablas...');
    try {
        await runAsync(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                country TEXT,
                clientIp TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'Pending',
                replyMessage TEXT,
                repliedAt DATETIME,
                repliedBy TEXT
            )
        `);
        console.log('Tabla contacts lista o ya existía.');

        await runAsync(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transactionId TEXT UNIQUE, -- El ID de la transacción de la pasarela
                userId INTEGER, -- Referencia a un usuario si tuvieras tabla de usuarios
                amount REAL,
                currency TEXT,
                status TEXT, -- Estado del pago real (ej. 'succeeded', 'failed')
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                buyerEmail TEXT,
                description TEXT,
                apiResponse TEXT -- Opcional: guardar la respuesta completa de la API
            )
        `);
         console.log('Tabla payments lista o ya existía.');


        console.log('Creación/verificación de tablas completada.');
    } catch (error) {
        console.error('Error durante la creación/verificación de tablas:', error);
        // Dependiendo de la severidad, podrías querer lanzar el error para que app.ts lo maneje
        throw error;
    }
}

// Exporta la instancia de la base de datos y la función de inicialización de tablas
export { db, initTables };

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error cerrando la base de datos desde db.ts:', err.message);
        }
        console.log('Conexión a la base de datos cerrada desde db.ts.');
    });
});
