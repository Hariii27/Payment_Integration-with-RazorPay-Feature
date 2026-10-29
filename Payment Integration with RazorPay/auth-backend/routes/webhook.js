const crypto = require('crypto');
const Payment = require('../models/Payment');
const safeEqual = require('../utils/safeEqual');

// req.body is a raw Buffer here (see express.raw in server.js)
module.exports = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (!signature || !safeEqual(signature, expected)) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === 'order.paid') {
      const orderId = event.payload.order.entity.id;
      const paymentId = event.payload.payment.entity.id;

      await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: { $ne: 'paid' } },
        { status: 'paid', razorpayPaymentId: paymentId }
      );
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;

      await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, status: 'created' },
        { status: 'failed' }
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};