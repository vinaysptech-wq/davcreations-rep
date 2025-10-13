const Joi = require('joi');

/**
 * Validation schema for user login requests
 * Validates the required email and password fields for authentication
 * @type {Joi.ObjectSchema}
 * @property {string} email - Must be a valid email address format
 * @property {string} password - Required password string (no specific format enforced here)
 */
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Validation schema for user registration requests
 * Validates all required and optional fields for creating a new user account
 * @type {Joi.ObjectSchema}
 * @property {string} first_name - Required first name (string)
 * @property {string} last_name - Required last name (string)
 * @property {string} email - Required valid email address
 * @property {string} password - Required password with minimum 6 characters
 * @property {number} [user_typeid] - Optional user type ID (numeric)
 * @property {string} [address] - Optional address string
 * @property {string} [phone] - Optional phone number string
 * @property {string} [city] - Optional city name string
 * @property {string} [state] - Optional state name string
 */
const registerSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  user_typeid: Joi.number().optional(),
  address: Joi.string().optional(),
  phone: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
});

/**
 * Validation schema for updating user preferences
 * Validates optional preference settings that users can customize
 * @type {Joi.ObjectSchema}
 * @property {string} [theme] - Optional theme setting ('light' or 'dark')
 * @property {string} [language] - Optional language code (2-10 characters)
 * @property {boolean} [email_notifications] - Optional email notification preference
 * @property {boolean} [push_notifications] - Optional push notification preference
 */
const updatePreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark').optional(),
  language: Joi.string().min(2).max(10).optional(),
  email_notifications: Joi.boolean().optional(),
  push_notifications: Joi.boolean().optional(),
});

/**
 * Validation schema for bulk operations on modules
 * Used for assigning or removing multiple module permissions at once
 * @type {Joi.ObjectSchema}
 * @property {number[]} moduleIds - Required array of integer module IDs (minimum 1 item)
 */
const bulkOperationsSchema = Joi.object({
  moduleIds: Joi.array().items(Joi.number().integer()).min(1).required(),
});

module.exports = {
  loginSchema,
  registerSchema,
  updatePreferencesSchema,
  bulkOperationsSchema,
};