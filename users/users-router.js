const express = require('express');
const middleware = require('./users-middleware')
const controller = require('./users-controller')
const globalMiddleware = require('../middlewares/global-user-middlewares')

const router = express.Router();


// Create User
router.post('/signup', globalMiddleware.checkBody, middleware.ValidateUserCreation, controller.CreateUser)

// Verify Email
router.get('/verify-email', controller.UserVerifyEmail);

// Resend verification email
router.post('/resend-verification-email', globalMiddleware.checkBody, middleware.UserReverifyValidation, controller.UserReVerifyEmail);

// Signin User
router.post('/login', globalMiddleware.checkBody, middleware.UserLoginValidation, controller.UserLogin)

// Signed in User Create Anniversary
router.post('/create-mine', globalMiddleware.checkBody, globalMiddleware.bearerTokenAuth, middleware.CreateAnniversaryValidation, controller.CreateAnniversary)

// Signed in User Create Other Anniversary
router.post('/create-other', globalMiddleware.checkBody, globalMiddleware.bearerTokenAuth, middleware.CreateOtherAnniversaryValidation, controller.CreateOtherAnniversary)

// User gets their anniversaries
router.get('/my-anniversaries', globalMiddleware.bearerTokenAuth, controller.UserGetAnniversaries);

// User gets other anniversaries
router.get('/other-anniversaries', globalMiddleware.bearerTokenAuth, controller.UserGetOtherAnniversaries);


module.exports = router
