import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
console.log('MONGO_URI loaded:', uri ? '✅ YES' : '❌ NOT FOUND');
console.log('Connecting to MongoDB...');

try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ SUCCESS: MongoDB Connected to', conn.connection.host);
    await mongoose.disconnect();
    process.exit(0);
} catch (e) {
    console.error('❌ FAILED:', e.message);
    process.exit(1);
}
