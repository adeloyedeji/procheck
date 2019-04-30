const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PlagiarismSchema = new Schema({
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    status: { type: Boolean, default: 1},
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plagiarism', PlagiarismSchema);