import mongoose from 'mongoose';
import { config } from '../config/index.js';

/**
 * Establishes a connection to the MongoDB Atlas database.
 * @returns {Promise<void>}
 */
export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Successfully connected to production database (MongoDB Atlas).');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}
