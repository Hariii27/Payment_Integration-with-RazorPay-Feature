require('.env').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/');
const paymentRoutes = require('./routes/payment');
const webhookHandler = require('./routes/webhook');

const app = express();

app.use(cors({ origin:'http://localhost:5173'}));

//Webhook needs the RAW body for signature verification.
// It must be registered BEFORE express.jso()

app.post(
    '/api/payment/webhook',
    express.raw({ type:'/application/json'}),
    webhookHandler
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

app.use((err, req, res, next)=>{
    console.error(err);
    res.status(500).json({message:'Internal server error'});
});

mongoose
    .connect(process.env.MONFO_URI)
    .then(()=>{
        console.log('MongoDB connected');
        app.listen(process.env.port, () =>
            console.log(`Server running on port ${process.env.PORT}`)
        );
    })
    .catch((err)=>{
        console.error('Database connection failed:', err.messgae);
        process.exit(1);
    });    

