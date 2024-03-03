const joi = require('joi')
const logger = require('../logger');


const ValidateUserCreation = async (req, res, next) => {
  try {
    logger.info('[ValidateUserCreation] => Validate user creation process started...');
    const schema = joi.object({
      first_name: joi.string().required(),
      last_name: joi.string().required(),
      email: joi.string().email().required(),
      password: joi.string().required(),
      confirm_password: joi.string().valid(joi.ref('password')).required()
      .messages({
        'any.only': 'Password does not match',
        'any.required': 'Confirm password is required'
      }),
    }).options({ allowUnknown: true }); // sets all unknown true (ignoring checks like terms)

    await schema.validateAsync(req.body, { abortEarly: true })

    logger.info('[ValidateUserCreation] => Validate user creation process done.');
    next()
  } catch (error) {
      return res.status(422).json({
        message: error.message,
        success: false
      })
  }
}

const CreateAnniversaryValidation = async (req, res, next) => {
  try {
    logger.info('[CreateAnniversaryValidation] => Create anniversary validation process started...');
    const schema = joi.object({
      anniversary_name: joi.string().required(),
      next_date: joi.date().iso().required(), // Ensure next_date is a valid ISO date,
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[CreateAnniversaryValidation] => Create anniversary validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}

const CreateOtherAnniversaryValidation = async (req, res, next) => {
  try {
    logger.info('[CreateOtherAnniversaryValidation] => Create other anniversary validation process started...');
    const schema = joi.object({
      anniversary_name: joi.string().required(),
      recipient_name: joi.string().required(),
      recipient_email: joi.string().email().required(),
      next_date: joi.date().iso().required(), // Ensure next_date is a valid ISO date,
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[CreateOtherAnniversaryValidation] => Create other anniversary validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}


const UserReverifyValidation = async (req, res, next) => {
  try {
    logger.info('[UserReverifyValidation] => User Reverify validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[UserReverifyValidation] => User Reverify validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}

const UserLoginValidation = async (req, res, next) => {
  try {
    logger.info('[UserLoginValidation] => User login validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[UserLoginValidation] => User login validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}

const UserForgotPasswordValidation = async (req, res, next) => {
  try {
    logger.info('[UserForgotPasswordValidation] => User forgot password validation process started...');
    const schema = joi.object({
      email: joi.string().email().required(),
    })

    await schema.validateAsync(req.body, { abortEarly: true })
    
    logger.info('[UserForgotPasswordValidation] => User forgot password validation process done.');
    next()
} catch (error) {
    return res.status(422).json({
      message: error.message,
      success: false
    })
  }
}


module.exports = {
  ValidateUserCreation,
  CreateAnniversaryValidation,
  CreateOtherAnniversaryValidation,
  UserReverifyValidation,
  UserLoginValidation,
  UserForgotPasswordValidation
}