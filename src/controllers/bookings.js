const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Clinic = require('../models/clinic');
const mqttController = require('./mqtt');
const Joi = require('joi');

const { customAlphabet } = require('nanoid');
const {timeStringToDate} = require('../util/time');
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, 14);

const router = express.Router();

const topic = '/team13/booking';

const dateRegex = new RegExp('^\\d{4}-\\d{2}-\\d{2}$');
const timeRegex = new RegExp('^\\d{2}:\\d{2}$');

const bookingCreateBody = Joi.object({
    date: Joi.string().regex(dateRegex).required(),
    startTime: Joi.string().regex(timeRegex).required(),
    endTime: Joi.string().regex(timeRegex).required()
});

router.post('/api/clinics/:clinicId/bookings', async (req, res, next) => {
    if (mqttController.isCircuitBreakerOpen()) {
        const error = new Error('Booking request service is down, please try again later!');
        error.status = 503;

        return next(error);
    }

    const { error } =  bookingCreateBody.validate(req.body);

    if (error) {
        error.status = 400;

        return next(error);
    }

    const clinicId = parseInt(req.params.clinicId);

    if (isNaN(clinicId)) {
        const error = new Error(`Invalid clinic id (${clinicId})`);
        error.status = 400;

        return next(error);
    }

    const clinicExists = await Clinic.exists({ id: clinicId });

    if (!clinicExists) {
        const error = new Error(`Clinic with id '${clinicId}' not found`);
        error.status = 404;

        return next(error);
    }

    const data = Object.assign({}, req.body);
    data.clinicId = clinicId;
    data.code = nanoid();

    const payload = {
        method: 'create',
        data: data
    };

    mqttController.publish(topic, JSON.stringify(payload));
    return res.status(202).json({ code: data.code });
});

router.get('/api/clinics/:clinicId/bookings', async (req, res, next) => {
    const clinicId = parseInt(req.params.clinicId);

    if (isNaN(clinicId)) {
        const error = new Error(`Invalid clinic id (${clinicId})`);
        error.status = 400;

        return next(error);
    }

    if (!req.query.date) {
        const error = new Error('Missing query parameter \'date\'');
        error.status = 400;

        return next(error);
    }

    const date = req.query.date;

    if (!dateRegex.test(date)) {
        const error = new Error('Invalid format for parameter \'date\' (should be YYYY-MM-DD)');
        error.status = 400;

        return next(error);
    }

    const state = req.query.state || 'available';

    if (state !== 'available' && state !== 'unavailable') {
        const error = new Error('Invalid value for query parameter \'state\'');
        error.status = 400;

        return next(error);
    }

    const clinic = await Clinic.findOne({ id: clinicId }).exec();

    if (!clinic) {
        const error = new Error(`Clinic with id '${clinicId}' not found`);
        error.status = 404;

        return next(error);
    }

    const bookings = await Booking.find({ id: clinicId, date: date}, { _id: 0, __v: 0, clinicId: 0, code: 0 }).exec();

    if (state === 'unavailable') {
        return res.status(200).json(bookings);
    }

    const { startTime, endTime } = clinic.getOpeningHours(date);

    if (!startTime || !endTime) {
        const error = new Error(`Failed to fetch current opening hours for clinic with id '${clinic.id}'`);
        error.status = 400;

        return next(error);
    }

    const timeSlots = generateTimeSlots(
        startTime,
        endTime,
        bookings.map(booking => timeStringToDate(booking.startTime, booking.date).toMillis())
    );

    return res.status(200).json(timeSlots);
});

router.get('/api/bookings/:code', (req, res, next) => {
    const code = req.params.code;

    Booking.findOne({ code: code.toUpperCase() }, { _id: 0, __v: 0 },  (err, booking) => {
        if (err) {
            if (err instanceof mongoose.CastError) {
                err.status = 400;
                err.message = 'Invalid booking code';
            }

            return next(err);
        }

        if (!booking) {
            const error = new Error(`Booking with code '${code}' not found`);
            error.status = 404;

            return next(error);
        }

        return res.status(200).json(booking);
    });
});

const generateTimeSlots = (startTime, endTime, unavailable) => {
    const dayLength = endTime.diff(startTime, 'minutes').toObject().minutes;
    const slots = Math.floor(dayLength / 30);

    return [...Array(slots).keys()].map(i => startTime.plus({ minutes: 30 * i }))
        .filter(slot => !unavailable.includes(slot.toMillis()))
        .filter(slot => slot.hour !== 12);
};

module.exports = router;
