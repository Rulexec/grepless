module.exports = function(options) {
    return function(req, res, next) {
        req.url = decodeURIComponent(req.url);

        next();
    };
};
