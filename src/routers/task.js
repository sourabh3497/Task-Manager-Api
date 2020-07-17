const express = require('express');
const Task = require('../models/task');
const auth = require('../middlewares/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        user: req.user._id
    })

    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }

});

//GET /tasks?completed=true
//GET /tasks?limit=2,skip=2
//GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const parameters = req.query;
    const match = {}, sort = {};
    
    if (parameters.completed) {
        match.completed = parameters.completed === 'true';
    }

    if (parameters.sortBy) {
        const parts = parameters.sortBy.split(':');
        sort[parts[0]] = (parts[1] === 'desc') ? -1 : 1;
    }

    try {
        const user = req.user;
        
        //const tasks = await Task.find({ user: req.user._id });
        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(parameters.limit),
                skip: parseInt(parameters.skip),
                sort
            }
        }).execPopulate();
        res.send(user.tasks);
    } catch (e) {
        res.status(500).send(e);
    }
    
});

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ _id, user: req.user._id });

        if (!task) {
           return res.status(404).send();
        }
        
        res.send(task);
    } catch (e) {
        res.status(500).send(e)
    }

});

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const allowedUpdates = new Set(['description', 'completed']);
    const updates = Object.keys(req.body);

    const isValidOperation = updates.every((update) => allowedUpdates.has(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates!' });
    }

    try {
        const task = await Task.findOne({ _id, user: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    }

});

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOneAndDelete({ _id, user: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;