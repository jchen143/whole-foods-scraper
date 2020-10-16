const mongoose = require("mongoose"); 

const groceryItemSchema = new mongoose.Schema({
    title: String, 
    price: Number,
    category: String,
    unit: String, 

})

let groceryItem = mongoose.model("groceryItem", groceryItemSchema); 

module.exports = groceryItem; 
