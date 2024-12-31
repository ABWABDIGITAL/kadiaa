const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const caseTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        unique: true, 
    },
    image: {
        type: String, 
        default: null,
    },
    id: {
        type: String,
        unique: true, 
        default: () => new mongoose.Types.ObjectId()?.toString(), 
    },
}, { timestamps: true, toJSON: { transform: (doc, ret) => { delete ret.__v; } } });
caseTypeSchema.index({ name: 'text' });

module.exports = mongoose.model('CaseType', caseTypeSchema);
