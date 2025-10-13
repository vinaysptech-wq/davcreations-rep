/**
 * Utility to handle Joi validation errors and convert them to user-friendly messages
 * @param {Object} joiError - Joi validation error object
 * @returns {string} User-friendly error message
 */
function formatValidationError(joiError) {
  if (!joiError || !joiError.details || !joiError.details[0]) {
    return 'Invalid input data';
  }

  const detail = joiError.details[0];
  const field = detail.path.join('.');
  const type = detail.type;

  // Map common Joi error types to user-friendly messages
  const fieldMessages = {
    'first_name': 'First name',
    'last_name': 'Last name',
    'email': 'Email address',
    'password': 'Password',
    'old_password': 'Current password',
    'new_password': 'New password',
    'confirm_password': 'Password confirmation',
    'user_type_name': 'User type name',
    'module_name': 'Module name',
    'theme': 'Theme',
    'language': 'Language',
    'email_notifications': 'Email notifications',
    'push_notifications': 'Push notifications',
    'subject': 'Subject',
    'description': 'Description',
    'priority': 'Priority',
    'address': 'Address',
    'phone': 'Phone number',
    'city': 'City',
    'state': 'State',
    'level': 'Log level',
    'setting_key': 'Setting key',
    'setting_value': 'Setting value',
    'moduleIds': 'Module IDs',
    'moduleId': 'Module ID',
    'permissions': 'Permissions',
    'view': 'View permission',
    'create': 'Create permission',
    'update': 'Update permission',
    'delete': 'Delete permission',
    'refreshToken': 'Refresh token'
  };

  const fieldName = fieldMessages[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  switch (type) {
  case 'any.required':
  case 'string.empty':
    return `${fieldName} is required`;

  case 'string.email':
    return `${fieldName} must be a valid email address`;

  case 'string.min': {
    const minLength = detail.context.limit;
    if (field.includes('password')) {
      return `${fieldName} must be at least ${minLength} characters long`;
    }
    return `${fieldName} must be at least ${minLength} characters long`;
  }

  case 'string.max': {
    const maxLength = detail.context.limit;
    return `${fieldName} must not exceed ${maxLength} characters`;
  }

  case 'string.pattern.base':
    if (field.includes('password')) {
      return `${fieldName} must contain at least one uppercase letter, one lowercase letter, and one number`;
    }
    return `${fieldName} format is invalid`;

  case 'number.base':
    return `${fieldName} must be a number`;

  case 'number.integer':
    return `${fieldName} must be a whole number`;

  case 'number.min':
    return `${fieldName} must be at least ${detail.context.limit}`;

  case 'number.max':
    return `${fieldName} must not exceed ${detail.context.limit}`;

  case 'boolean.base':
    return `${fieldName} must be true or false`;

  case 'array.base':
    return `${fieldName} must be a list`;

  case 'array.min':
    return `${fieldName} must contain at least ${detail.context.limit} items`;

  case 'any.only':
    if (detail.context.valids && detail.context.valids.length > 0) {
      const allowedValues = detail.context.valids.map(v => `"${v}"`).join(', ');
      return `${fieldName} must be one of: ${allowedValues}`;
    }
    return `${fieldName} has an invalid value`;

  default:
    return `${fieldName} is invalid`;
  }
}

/**
 * Create a standardized validation error response
 * @param {Object} joiError - Joi validation error object
 * @returns {Object} Standardized error response
 */
function createValidationErrorResponse(joiError) {
  return {
    message: formatValidationError(joiError),
    type: 'VALIDATION_ERROR',
    details: joiError.details.map(detail => ({
      field: detail.path.join('.'),
      message: formatValidationError({ details: [detail] })
    }))
  };
}

module.exports = {
  formatValidationError,
  createValidationErrorResponse
};