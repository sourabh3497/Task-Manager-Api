const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const payload = await jwt.verify(token, User.signature);
        const _id = payload._id;

        const user = await User.findOne({ _id, 'tokens.token': token });

        if (!user) {
            throw new Error();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        res.status(400).send({ error: 'Please Authenticate' });
    }
}

module.exports = auth;