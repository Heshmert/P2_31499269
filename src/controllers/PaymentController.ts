// src/controllers/PaymentController.ts

import { Request, Response } from 'express';
import fetch from 'node-fetch'; // Asegúrate de que node-fetch@2 y @types/node-fetch@2 estén instalados
import MailerService from '../services/MailerService';
// --- Importamos PaymentModel ---
import PaymentModel from '../models/PaymentModel';


// Importante: NO llames a dotenv.config() aquí. Debe estar solo en app.ts.
// import * as dotenv from 'dotenv';
// dotenv.config();


class PaymentController {
    // Definimos la URL base de la API como una propiedad de la clase
    private readonly API_BASE_URL = 'https://fakepayment.onrender.com';
    private mailerService: MailerService;
    // --- Añadimos la propiedad paymentModel ---
    private paymentModel: PaymentModel;


    // Leemos la clave de API de las variables de entorno (process.env se carga en app.ts)
    private readonly API_KEY = process.env.FAKE_PAYMENT_API_KEY;

    // --- Constructor que recibe MailerService Y PaymentModel ---
    constructor(mailerService: MailerService, paymentModel: PaymentModel) {
        this.mailerService = mailerService;
        // --- Asignamos PaymentModel ---
        this.paymentModel = paymentModel;


        // Una advertencia útil si la clave de API no se carga.
        // Esto ahora funcionará porque dotenv.config() debe estar en app.ts.
        if (!this.API_KEY) {
            console.warn('ADVERTENCIA: La clave de API de Fake Payment (FAKE_PAYMENT_API_KEY) no está configurada en .env. Las solicitudes de pago fallarán.');
        }

        // Atar (bind) los métodos para mantener el contexto 'this'
        this.showPaymentForm = this.showPaymentForm.bind(this);
        this.add = this.add.bind(this);
    }

    // Método para mostrar la página del formulario de pago
    showPaymentForm(req: Request, res: Response): void {
        console.log('PaymentController - showPaymentForm: Ejecutando GET /payment.');
        const successPaymentMessage = req.flash('paymentSuccess');
        const errorPaymentMessage = req.flash('paymentError');
        res.render('payment', { // Asume que tienes una vista 'payment.ejs' o similar
            pageTitle: 'Procesar Pago',
            successPaymentMessage: successPaymentMessage.length > 0 ? successPaymentMessage[0] : null,
            errorPaymentMessage: errorPaymentMessage.length > 0 ? errorPaymentMessage[0] : null
        });
    }

    // Método para manejar la solicitud POST del formulario de pago
    async add(req: Request, res: Response): Promise<void> {
        console.log('PaymentController - add: Ejecutando POST /payment.'); // Ajusta la ruta si es diferente
        console.log('PaymentController - req.body recibido:', req.body);

        const {
            service, // Asumo que esto es un campo del formulario
            email,   // Email del usuario para la confirmación
            cardName,
            cardNumber,
            expiryMonth,
            expiryYear,
            cvc,
            amount,
            currency
        } = req.body;

        // Validación de campos obligatorios del formulario
        if (!service || !email || !cardName || !cardNumber || !expiryMonth || !expiryYear || !cvc || !amount || !currency) {
            console.log('Validation failed: Faltan campos obligatorios en el formulario.');
            req.flash('paymentError', 'Error: Todos los campos del formulario de pago son obligatorios.');
            return res.redirect('/payment'); // Ajusta la ruta si es diferente
        }

        // Limpiar número de tarjeta y parsear monto
        const cleanedCardNumber = cardNumber.replace(/[\s-]/g, '');
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            req.flash('paymentError', 'Error: El monto a pagar debe ser un número positivo.');
            return res.redirect('/payment'); // Ajusta la ruta si es diferente
        }

        // Generar referencia y descripción para la API de pago simulada
        const reference = `payment_id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const description = `Pago por servicio: ${service}`;
        const formattedExpiryMonth = String(expiryMonth).padStart(2, '0');

        try {
            const paymentPayload = {
                "amount": parsedAmount.toFixed(2), // Enviar como cadena con 2 decimales
                "card-number": cleanedCardNumber,
                "cvv": cvc,
                "expiration-month": formattedExpiryMonth,
                "expiration-year": String(expiryYear),
                "full-name": cardName,
                "currency": currency,
                "description": description,
                "reference": reference
            };

            console.log('PaymentController - Enviando a API de pago:', paymentPayload);

            // --- Llamada a la API de pago simulada ---
            const fakePaymentApiResponse = await fetch(`${this.API_BASE_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}` // <-- Usa la clave de API configurada
                },
                body: JSON.stringify(paymentPayload)
            });

            const rawResponseText = await fakePaymentApiResponse.text();
            console.log('Respuesta RAW de la API de pago:', rawResponseText);

            let paymentResult;
            try {
                paymentResult = JSON.parse(rawResponseText);
            } catch (parseError) {
                console.error('Error al parsear la respuesta de la API como JSON:', parseError);
                req.flash('paymentError', `Error en el pago: La API devolvió un formato inesperado o un error interno. (Respuesta: ${rawResponseText.substring(0, 100)}...)`);
                return res.redirect('/payment'); // Ajusta la ruta si es diferente
            }


            // --- Manejo del resultado del pago ---
            if (fakePaymentApiResponse.ok && paymentResult.success) { // Verifica también si la respuesta HTTP fue exitosa (código 2xx)
                console.log('Pago simulado exitoso:', paymentResult);
                // --- CORRECCIÓN: Acceder a transaction_id o reference dentro de 'data' ---
                req.flash('paymentSuccess', `¡Pago exitoso! Transacción ID: ${paymentResult.data.transaction_id || paymentResult.data.reference}`);

                // --- Enviar correo de confirmación al usuario después de un pago exitoso ---
                try {
                     // Usar sendGenericEmail (para unificar el envío y usar el BCC al profesor)
                     // Asumiendo que tienes una plantilla genérica 'paymentConfirmation' y el loadTemplate la maneja.
                     await this.mailerService.sendGenericEmail(
                         email, // 'to' user's email
                         `Confirmación de tu Pago - Transacción ${paymentResult.data.transaction_id || paymentResult.data.reference}`, // <-- CORRECCIÓN AQUÍ
                         'paymentConfirmation', // template name (asume que esta plantilla existe y es manejada por loadTemplate)
                         { // context for template (adapta las claves a tu plantilla genérica)
                             name: cardName, // Nombre del usuario para la plantilla
                             transactionId: paymentResult.data.transaction_id || paymentResult.data.reference, // <-- CORRECCIÓN AQUÍ
                             amount: parsedAmount.toFixed(2), // Monto formateado
                             currency: currency,
                             paymentDateTime: new Date().toLocaleString(), // Fecha y hora del pago
                             subject: 'Confirmación de Pago', // Pasado a plantilla genérica
                             closing: 'Tu pedido ha sido procesado. Si tienes alguna pregunta, no dudes en contactarnos.' // Pasado a plantilla genérica
                         },
                          undefined, // no cc
                          // El BCC al profesor se añade automáticamente dentro de sendGenericEmail
                     );
                     console.log('PaymentController: Correo de confirmación de pago enviado al usuario (y BCC al profesor si está configurado).');


                } catch (emailError) {
                    console.error('PaymentController: Error al enviar correo de confirmación de pago:', emailError);
                    // Decide cómo manejar esto. Un error en el correo puede no ser crítico para el pago.
                }

                // --- Descomentamos y usamos this.paymentModel para guardar el registro ---
                try {
                    // Asegúrate de tener el PaymentModel inyectado en el constructor si haces esto
                    await this.paymentModel.addPaymentRecord(
                        paymentResult.data.transaction_id || paymentResult.data.reference, // <-- CORRECCIÓN AQUÍ
                        // null, // userId (si no tienes sistema de usuarios) - Asegúrate de que tu modelo acepte NULL o un valor por defecto
                        parsedAmount,
                        currency,
                        'completed', // Estado del pago real
                        email, // Email del comprador
                        description // Descripción del pago
                    );
                    console.log('Registro de pago guardado en la base de datos.');
                } catch (dbError) {
                    console.error('Error al guardar registro de pago en DB:', dbError);
                    // Decide cómo manejar esto. Puede no ser crítico si el pago ya se hizo.
                }
                // --- Fin del bloque descomentado ---

            } else {
                console.error('Pago simulado fallido:', paymentResult);
                req.flash('paymentError', `Error en el pago: ${paymentResult.message || 'Transacción rechazada.'}`);
            }
        } catch (apiError) {
            console.error('Error al comunicarse con la API de pago simulado (FetchError):', apiError);
            req.flash('paymentError', 'Error al procesar el pago. Intenta de nuevo más tarde.');
        }


        res.redirect('/payment'); // Ajusta la ruta si es diferente
    }
}

export default PaymentController;
