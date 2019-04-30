const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
    owner: { type: Schema.Types.ObjectId, ref: 'User'},
    title: { type: String, unique: true },
    abstract: String,
    avatar: String,
    project: String,
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);