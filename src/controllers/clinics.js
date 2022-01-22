const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Clinic = require('../models/clinic');
const paginator = require('./paginator');

router.get('/api/clinics', paginator(Clinic), (req, res) => {
    res.status(200).json(res.paginationResults);
});

router.get('/api/clinics/:id', (req, res, next) => {
    const clinicId = req.params.id;
    
    Clinic.findOne({ id: clinicId }, (err, clinic) => {
        if (err) { 
            if (err instanceof mongoose.CastError) {
                err.status = 400;
                err.message = 'Invalid clinic id';
            }
            return next(err); 
        }
        
        if (!clinic) {
            const error = new Error();
            error.status = 404;
            error.message = `Clinic with id ${clinicId} not found`;
            
            return next(error);
        }

        res.status(200).json(clinic);
    });
});

module.exports = router;