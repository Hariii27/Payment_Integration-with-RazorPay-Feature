const express = require('express');
const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const safeEqual = require('../utils/safeEqual');
const { products, getProduct } = require('../config/products');

const router = express.Router();

// GET /api/payment/products
router.get('/products', (req, res) => {
  res.json({ products });
});

// POST /api/payment/create-order
router.post('/create-order', auth, async (req, res, next) => {
  try {
    const product = getProduct(req.body.productId);
    if (!product) {
      return res.status(400).json({ message: 'Invalid product' });
    }

    const amount = product.price * 100; // rupees to paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { userId: req.user._id.toString(), productId: product.id },
    });

    await Payment.create({
      user: req.user._id,
      productId: product.id,
      productName: product.name,
      amount,
      currency: 'INR',
      razorpayOrderId: order.id,
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      productName: product.name,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/payment/verify
router.post('/verify', auth, async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });
    if (!payment) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Idempotent: already verified earlier (for example by the webhook)
    if (payment.status === 'paid') {
      return res.json({ message: 'Payment already verified', payment });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!safeEqual(expected, razorpay_signature)) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    res.json({ message: 'Payment verified', payment });
  } catch (err) {
    next(err);
  }
});

// GET /api/payment/my
router.get('/my', auth, async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ payments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;