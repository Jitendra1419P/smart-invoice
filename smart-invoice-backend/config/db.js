const mongoose = require("mongoose");

const defaultLocalMongo = "mongodb://127.0.0.1:27017/smart-invoice";
const configuredUri = process.env.MONGO_URI?.trim();
let useLocalFallback = !configuredUri;

const connectDB = async () => {
  const mongoUri = useLocalFallback ? defaultLocalMongo : configuredUri;

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(
      `❌ Error connecting to MongoDB (${mongoUri}): ${error.message}`,
    );

    if (!configuredUri) {
      console.warn(
        "⚠️ No MONGO_URI configured. Please install MongoDB locally or set MONGO_URI in .env.",
      );
    } else if (!useLocalFallback) {
      console.warn(
        "⚠️ Could not connect to the configured MongoDB Atlas URI. Falling back to local MongoDB at mongodb://127.0.0.1:27017/smart-invoice.",
      );
      useLocalFallback = true;
    } else {
      console.warn(
        "⚠️ Still unable to connect to local MongoDB. Install MongoDB locally or update MONGO_URI in .env.",
      );
    }

    console.log(
      "⚠️ Server is running, but database features will be unavailable until MongoDB connects.",
    );
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
