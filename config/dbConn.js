const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    // await mongoose.connect('mongodb://127.0.0.1:27017/techNotesDB', {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true
    // })
  } catch (err) {
    console.log(err)
  }
}

module.exports = connectDB