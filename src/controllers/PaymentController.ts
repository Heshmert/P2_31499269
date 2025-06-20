import { Request, Response } from 'express';
import fetch from 'node-fetch';
import MailerService from '../services/MailerService';
import PaymentModel from '../models/PaymentModel';

class PaymentController {
    private readonly API_BASE_URL = 'https://fakepayment.onrender.com';
    private mailerService: MailerService;
    private paymentModel: PaymentModel;
    private readonly API_KEY = process.env.FAKE_PAYMENT_API_KEY;

    constructor(mailerService: MailerService, paymentModel: PaymentModel) {
        this.mailerService = mailerService;
        this.paymentModel = paymentModel;
        if (!this.API_KEY) {
            console.warn('ADVERTENCIA: La clave de API de Fake Payment (FAKE_PAYMENT_API_KEY) no está configurada en .env. Las solicitudes de pago fallarán.');
        }
        this.showPaymentForm = this.showPaymentForm.bind(this);
        this.add = this.add.bind(this);
    }

    // Renderiza el formulario de pago
    showPaymentForm(req: Request, res: Response): void {
        res.render('payment', {
            pageTitle: 'Procesar Pago'
        });
    }

    // Procesa el pago y maneja la respuesta de la API simulada
    async add(req: Request, res: Response): Promise<void> {
        const {
            service,
            email,
            cardName,
            cardNumber,
            expiryMonth,
            expiryYear,
            cvc,
            amount,
            currency
        } = req.body;

        if (!service || !email || !cardName || !cardNumber || !expiryMonth || !expiryYear || !cvc || !amount || !currency) {
            req.flash('paymentError', 'Error: Todos los campos del formulario de pago son obligatorios.');
            return res.redirect('/payment');
        }

        const cleanedCardNumber = cardNumber.replace(/[\s-]/g, '');
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            req.flash('paymentError', 'Error: El monto a pagar debe ser un número positivo.');
            return res.redirect('/payment');
        }

        const reference = `payment_id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const description = `${service}`;
        const formattedExpiryMonth = String(expiryMonth).padStart(2, '0');

        try {
            const paymentPayload = {
                "amount": parsedAmount.toFixed(2),
                "card-number": cleanedCardNumber,
                "cvv": cvc,
                "expiration-month": formattedExpiryMonth,
                "expiration-year": String(expiryYear),
                "full-name": cardName,
                "currency": currency,
                "description": description,
                "reference": reference
            };

            const fakePaymentApiResponse = await fetch(`${this.API_BASE_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify(paymentPayload)
            });

            const rawResponseText = await fakePaymentApiResponse.text();
            let paymentResult;
            try {
                paymentResult = JSON.parse(rawResponseText);
            } catch (parseError) {
                req.flash('paymentError', `Error en el pago: La API devolvió un formato inesperado o un error interno.`);
                // Guarda el intento fallido en la base de datos
                await this.paymentModel.addPaymentRecord(
                    reference,
                    parsedAmount,
                    currency,
                    'failed',
                    email,
                    description
                );
                return res.redirect('/payment');
            }

            let paymentStatus = 'failed';
            let transactionId = reference;
            if (fakePaymentApiResponse.ok && paymentResult.success) {
                paymentStatus = 'completed';
                transactionId = paymentResult.data.transaction_id || paymentResult.data.reference;
                req.flash('paymentSuccess', `¡Pago exitoso! Transacción ID: ${transactionId}`);
                try {
                    await this.mailerService.sendPaymentConfirmation(
                        email,
                        cardName,
                        transactionId,
                        parsedAmount.toFixed(2),
                        currency,
                        new Date()
                    );
                } catch (emailError) {
                    // Error al enviar correo de confirmación de pago
                }
            } else {
                req.flash('paymentError', `Error en el pago: ${paymentResult.message || 'Transacción rechazada.'}`);
                if (paymentResult && paymentResult.data && paymentResult.data.transaction_id) {
                    transactionId = paymentResult.data.transaction_id;
                }
            }

            // Guarda el intento de pago (exitoso o fallido)
            try {
                await this.paymentModel.addPaymentRecord(
                    transactionId,
                    parsedAmount,
                    currency,
                    paymentStatus,
                    email,
                    description
                );
            } catch (dbError) {
                // Error al guardar registro de pago en DB
            }

        } catch (apiError) {
            req.flash('paymentError', 'Error al procesar el pago. Intenta de nuevo más tarde.');
            // Guarda el intento fallido en la base de datos
            await this.paymentModel.addPaymentRecord(
                reference,
                parsedAmount,
                currency,
                'failed',
                email,
                description
            );
        }
        res.redirect('/payment');
    }
}

export default PaymentController;
