// NOTE: pagination code adapted from: https://www.youtube.com/watch?v=ZX3qt0UWifc&t=373s

function paginator(model) {
    return async (req, res, next) => {
        try {
            const page = (parseInt(req.query.page) || 1);
            const size = (parseInt(req.query.size) || 15);

            // Since we retreive an array of json objects from mongoDB, we need to calculate the index of the array that corresponds to the page/size number.
            const startIndex = (page - 1) * size;
            const endIndex = page * size;

            const paginationResults = {};

            // These IF checks are used so that the client will know if there is a next/previous page (and the number of that page).
            if (endIndex < await model.countDocuments().exec()) {
                paginationResults.next = {
                    page: page + 1,
                    size: size
                };
            }

            if (startIndex > 0) {
                paginationResults.previous = {
                    page: page - 1,
                    size: size
                };
            }

            paginationResults.results = await model.find().limit(size).skip(startIndex).exec();
            res.paginationResults = paginationResults;
            next();
        } catch(err) {
            return next(err); // NOTE: According to: https://expressjs.com/en/guide/error-handling.html "If you pass anything to the next() function (except the string 'route'), Express regards the current request as being an error and will skip any remaining non-error handling routing and middleware functions". (Pretty long comment, but I felt this is good to mention as I was very confused by this initially).
        }
    };
       
}

module.exports = paginator;