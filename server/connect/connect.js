import mongoose from 'mongoose';
import sanitizedConfig from '../config.js';

async function connect() {
  const db = await mongoose.connect(sanitizedConfig.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  return db;
}

export default connect;