const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://spesh:sp990201@cluster0.tmehhre.mongodb.net/?appName=MixitApp",
      
    );
   
    console.log("MongoDB Connected");
    
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
