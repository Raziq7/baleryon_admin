import jwt from 'jsonwebtoken';
import sanitizedConfig from '../config.js';

const generateToken = (id) => {
  return jwt.sign({ id }, sanitizedConfig.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export default generateToken;