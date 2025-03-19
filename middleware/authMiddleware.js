import jwt from 'jsonwebtoken';
import User from '../models/User.js';



export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure user ID is properly extracted
    req.user = {
      id: decoded.id || decoded._id || decoded.userId || decoded.sub,
      role: decoded.role || 'user' // Ensure role is available
    };

    console.log("Decoded token:", req.user);

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};


export const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Only ${role} can access this route`
      });
    }
    next();
  };
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    next();
  };
};