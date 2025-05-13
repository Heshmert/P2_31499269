import { Request, Response } from 'express';
import fetch from 'node-fetch';
import MailerService from '../services/MailerService';


class PaymentController {
    private readonly API_BASE_URL = 'https://fakepayment.onrender.com';
    private mailerService: MailerService;
    private readonly API_KEY = process.env.FAKE_PAYMENT_API_KEY; 

    constructor(mailerService: MailerService) {
        this.mailerService = mailerService;
        this.showPaymentForm = this.showPaymentForm.bind(this); 
        this.add = this.add.bind(this);
        // ------------------------------------------
        // Una advertencia útil si la clave de API no se carga.
        if (!this.API_KEY) {
            console.warn('ADVERTENCIA: La clave de API de Fake Payment (FAKE_PAYMENT_API_KEY) no está configurada en .env. Las solicitudes de pago fallarán.');
        }
    }

    // Método para mostrar la página del formulario de pago
    showPaymentForm(req: Request, res: Response): void {
        console.log('PaymentController - showPaymentForm: Ejecutando GET /payment.');
        const successPaymentMessage = req.flash('paymentSuccess');
        const errorPaymentMessage = req.flash('paymentError');
        res.render('payment', {
            pageTitle: 'Procesar Pago',
            successPaymentMessage: successPaymentMessage.length > 0 ? successPaymentMessage[0] : null,
            errorPaymentMessage: errorPaymentMessage.length > 0 ? errorPaymentMessage[0] : null
        });
    }

    // Método para manejar la solicitud POST del formulario de pago
    async add(req: Request, res: Response): Promise<void> {
        console.log('PaymentController - add: Ejecutando POST /payment/add.');
        console.log('PaymentController - req.body recibido:', req.body);

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

        // Validación de campos obligatorios del formulario
        if (!service || !email || !cardName || !cardNumber || !expiryMonth || !expiryYear || !cvc || !amount || !currency) {
            console.log('Validation failed: Faltan campos obligatorios en el formulario.');
            req.flash('paymentError', 'Error: Todos los campos del formulario de pago son obligatorios.');
            return res.redirect('/payment');
        }

        // ***** Validar que la API Key esté presente *****
        if (!this.API_KEY) {
            console.error('Error: No se puede procesar el pago. FAKE_PAYMENT_API_KEY no está configurada.');
            req.flash('paymentError', 'Error interno: La clave de API para el pago no está configurada. Contacta al administrador.');
            return res.redirect('/payment');
        }

        const cleanedCardNumber = cardNumber.replace(/[\s-]/g, '');
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            req.flash('paymentError', 'Error: El monto a pagar debe ser un número positivo.');
            return res.redirect('/payment');
        }
        const reference = `payment_id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const description = `Pago por servicio: ${service}`;
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

            console.log('PaymentController - Enviando a API de pago:', paymentPayload);

            const fakePaymentApiResponse = await fetch(`${this.API_BASE_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
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
                return res.redirect('/payment');
            }
            if (paymentResult.success) {
                console.log('Pago simulado exitoso:', paymentResult);
                req.flash('paymentSuccess', `¡Pago exitoso! ${paymentResult.data.transaction_id}`);
                try {
                await this.mailerService.sendPaymentConfirmation(
                    email,
                    cardName,
                    paymentResult.data.transaction_id,
                    amount,
                    currency,
                    new Date() // Puedes usar la fecha actual del servidor o la fecha real de la transacción
                );
                console.log('PaymentController: Correo de confirmación de pago enviado al usuario.');
            } catch (emailError) {
                console.error('PaymentController: Error al enviar correo de confirmación de pago:', emailError);
            }
            } else {
                console.error('Pago simulado fallido:', paymentResult);
                req.flash('paymentError', `Error en el pago: ${paymentResult.message || 'Transacción rechazada.'}`);
            }
        }catch (apiError) {
            console.error('Error al comunicarse con la API de pago simulado (FetchError):', apiError);
            req.flash('paymentError', 'Error al procesar el pago. Intenta de nuevo más tarde.');
        }
        res.redirect('/payment');
    }
}

export default PaymentController;