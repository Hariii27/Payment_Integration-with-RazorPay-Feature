require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('becryptjs');
const User = require('../models/User');

(async () => {
    const { ADMIN_NAME = 'Admin', ADMIN_EMAIL, ADMIN_PASSWORD} = process.env;

    if(!ADMIN_EMAIL || !ADMIN_PASSWORD){
        console.error('set ADMIN_EMAIL and  ADMIN_PASSWORD  in .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase()});

    if(exisiting) {
        existing.role = 'admin';
        await existing.save();
        console.log(`Existing user promoted to admin: ${exisiting.eamil}`);
    } else {
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await user.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashed,
            role: 'admin',
        });
        console.log(`Admin created: ${ADMIN_EMAIL}`)
    }

    await mongoose.disconnect();
}) ();
