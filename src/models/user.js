const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const signature = process.env.SIGNATURE;
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    emailID: {
        type: String,
        unique: true,
        required:true,
        trim: true,
        lowercase: true,
        validate(email) {
            if (!validator.isEmail(email)) {
                throw new Error('Email is not valid');
            }

        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(password) {
            if (password.toLowerCase().includes('password')) {
                throw new Error(`Password should not contain "password"`);
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(age) {
            if (age < 0) {
                throw new Error('Age is not valid');
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'user'
})

userSchema.statics.findByCredentials = async (emailID, password) => {
    const user = await User.findOne({ emailID });

    if (!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user;
}

userSchema.methods.toJSON = function () {
    const user = this.toObject();

    delete user.password;
    delete user.tokens;
    
    return user;
}

userSchema.methods.generateAuthToken = async function () {
    const user = this;

    const token = await jwt.sign( { _id: user._id.toString() } , signature );
    user.tokens ? user.tokens.push({ token }) : user.tokens = [{ token }];
    await user.save();
    
    return token;
}

userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

userSchema.pre('remove', async function(next) {
    const user = this;

    await Task.deleteMany({ user: user._id });

    next();
});

const User = mongoose.model('User', userSchema);
User.signature = signature;

module.exports = User;