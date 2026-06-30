const mongoose = require('mongoose');
const { type } = require('synonyms/dictionary');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum:['admin','user'],
        default:'user'
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    // age: {
    //     type: Number,
    //     required: true
    // }
    password: {
        type:String,
        required:true
    },
    image: {
        type:String
    },
    status: {
        type:String,
        enum: ['active','suspended'],
        default: 'active'
    }
},{timestamps: true})

module.exports = mongoose.model('User',userSchema);