var mongoose = require('mongoose');

var mongoUrl = process.env.MONGODB_URL;

if (!mongoUrl) {
    console.error('Missing MONGODB_URL');
    process.exit(1);
}

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
    if (err) {
        console.error(`Failed to connect to MongoDB with URL: ${mongoUrl}`);
        console.error(err.stack);
        process.exit(1);
    }
    
    mongoose.connection.db.dropDatabase(function () {
        console.log(`Dropped database: ${mongoUrl}`);
    });

    mongoose.connection.db.collection('clinics').insertOne({
        id: 1,
        name: 'Your Dentist',
        owner: 'Dan Tist',
        dentists: 3,
        address: 'Spannmålsgatan 20',
        city: 'Gothenburg',
        coordinate: {
            longitude: 11.969388,
            latitude: 57.707619
        },
        openinghours: {
            monday: '9:00-17:00',
            tuesday: '8:00-17:00',
            wednesday: '7:00-16:00',
            thursday: '9:00-17:00',
            friday: '9:00-15:00'
        }
    }, () => {
        console.log(`Inserted sample clinic into database: ${mongoUrl}`);
        process.exit(0);
    });
});
