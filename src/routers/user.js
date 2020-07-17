const express = require('express');
const multer = require('multer');
const User = require('../models/user');
const auth = require('../middlewares/auth');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');

const router = new express.Router();

router.post('/users', async (req, res) => {
    let user = new User(req.body);

    try {
        user = await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
        sendWelcomeEmail(user.name, user.emailID);
    } catch(e) {
        res.status(400).send(e);
    }
    
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.emailID, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (e) {
        res.status(400).send(e);
    }

});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    } 
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/users/me', auth, async (req, res) => {
    try {
        res.send(req.user);
    } catch(e) {
        res.status(500).send(e);
    }
    
});

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = new Set(['name', 'age', 'emailID', 'password']);
    const updates = Object.keys(req.body);
    const _id = req.params.id;

    const isValidOperation = updates.every((update) => allowedUpdates.has(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates!'});
    }

    try {
        const user = req.user;

        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();
        
        res.send(user);
    } catch (e) {
        res.status(400).send(e);
    }

});

router.delete('/users/me', auth, async (req, res) => {
    const user = req.user;
    
    try {
        await user.remove();
        res.send(user);
        sendCancellationEmail(user.name, user.emailID);
    } catch (e) {
        res.status(500).send(e);
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
            return cb(new Error('Please provide image.'));
        }

        cb(null, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res, next) => {
    try {
        req.user.avatar = req.file.buffer;
        await req.user.save();
        res.send();
    } catch (e) {
        next(new Error('Please Provide image'));
    }
}, async (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        if (!req.user.avatar) {
            return res.status(404).send();
        }

        req.user.avatar = undefined;
        await req.user.save();
        res.send()
    } catch (e) {
        res.status(500).send();
    } 
});

module.exports = router;