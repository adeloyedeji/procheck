const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: Number, default: 0 },
    status: { type: Boolean, default: 0 },
    activated: { type: Boolean, default: 0 },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Profile', ProfileSchema)