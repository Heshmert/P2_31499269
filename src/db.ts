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
        // Tabla de contactos únicos
        await runAsync(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                country TEXT,
                clientIp TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla contacts lista o ya existía.');

        // Tabla de mensajes asociados a un contacto
        await runAsync(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contactId INTEGER NOT NULL,
                message TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'Pending',
                replyMessage TEXT,
                repliedAt DATETIME,
                repliedBy TEXT,
                FOREIGN KEY (contactId) REFERENCES contacts(id)
            )
        `);
        console.log('Tabla messages lista o ya existía.');

        // Tabla de pagos (sin cambios)
        await runAsync(`
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
