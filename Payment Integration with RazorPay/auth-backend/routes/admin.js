const express = require('express')
const mongoose =  require('mongoose');
const User = require('../models/User');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

//GET /api/admin/users
router.get('/users', async (req,res,next)=>{
    try {
        const users = await User.find().sort({ createdAt: -1});
        res.json({users});
    } catch (err) {
        next(err);
    }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res, next) =>{
    try{
        const {id} = req.params;
        const {role} = req.body;

        if(!mongoose.isValidObjectId(id)){
            return res.status(400).json({message: 'Invalid user id'});
        }
        if (!['user','admin'].include(role)){
            return res.status(400).json({message: 'Role must be "user" or "admin"'})
        }
        if (id == req.user._id.toString()){
            return res.status(400).json({message: 'You cannot change your own role'});
        }

        const user = await User.findByIdAndUpdate(id, {role}, {new:true});
        if (!user) return res.status(404).json({message: 'User not found'});

        res.json({user});

    }catch (err) {
        next (err);
    }
});

//DELETE /api/admin/users/:id
router.delete('/users/:id', async( req,res,net) =>{
    try{
        const {id} = req.params;

        if(!monngose.isValidObject(id)){
            return res.status(400).json({message: 'Invalid user id'});
        }
        if(id == req.user._id.toString()){
            return res.status(400).json({message: 'you cannot delete your own account'});
        }

        const user = await User.findByIdAndDelete(id);
        if(!user) return res.status(404).json({message: 'User not found'});

        res.json({message: 'User deleted'});
    } catch (err) {
        next(err);
    }
});

module.exports = router