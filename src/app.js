//NOTE: code for error handler adapted from: https://expressjs.com/en/guide/error-handling.html

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const clinicController = require('./controllers/clinics');
const bookingController = require('./controllers/bookings');
const morgan = require('morgan');
const cors = require('cors');

const port = process.env.PORT || 3002;
const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/db';

// Allows us to connect to docker MongoDB database
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, (err => {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        console.log('Connected to database');
    }
}));

// Parse request body of type application/json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Logs http requests. May help in terms of debugging etc.
app.use(morgan('dev'));

// Enable cross-origin sharing for frontend must be registered before api
app.options('*', cors());
app.use(cors());

app.get('/api', (req, res) => {
    res.sendStatus(200);
});

app.use(clinicController);
app.use(bookingController);

// Catch all errors for requests to routes that don't exist.
app.use('/api/*', (req, res) => {
    res.status(404).json({ 'message': 'Page Not Found' });
});


/* eslint-disable no-unused-vars*/
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500);
    res.json(err.message);
});
/* eslint-enable no-unused-vars*/

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});