const UserModel = require('../models/user-model');
const AnniversaryModel = require('../models/anniversary-model');
const OtherAnniversaryModel = require('../models/other-anniversary-model')
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const nodemailer = require('nodemailer');

require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: process.env.SERVICE,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

const CreateUser = async (req, res) => {
  try {
    logger.info('[CreateUser] => Create user process started.')
    const userFromRequest = req.body

    const existingEmailUser = await UserModel.findOne({ email: userFromRequest.email });

    if (existingEmailUser) {
      return res.status(409).json({
        message: 'User already exists',
      });
    }
  
    const user = await UserModel.create({
      first_name: userFromRequest.first_name,
      last_name: userFromRequest.last_name,
      email: userFromRequest.email,
      password: userFromRequest.password,
      confirm_password: userFromRequest.confirm_password
    });
  
    const token = await jwt.sign({ email: user.email, _id: user._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

      // Send email verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/users/verify-email?token=${token}`;
      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Email Verification',
        text: `Click on this link to verify your email: ${verificationLink}`
      };
  
      // Send email using nodemailer
      await transporter.sendMail(mailOptions);
    

    logger.info('[CreateUser] => Create user process done.')
    return res.status(201).json({
      message: 'User created successfully. Check your Email and verify to complete signup. Note: Verification link expires in 1hr.',
      user,
      token
    }) 
  } catch (error) {
      console.log(error)
      return res.status(500).json({
        message: 'Server Error',
        data: null
      })
  }

}

const UserVerifyEmail = async (req, res) => {
  try {
    logger.info('[UserVerifyEmail] => User verify Email process started.')
    const token = req.query.token;

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/users/resend-verification-email`
          return res.status(410).json({
            message: `Verification link has expired. Please request a new verification link with your email here - ${verificationLink}.`,
            success: false
          });
        } else {
          return res.status(401).json({
            message: 'Invalid verification link.',
            success: false
          });
        }
      }

      const user = await UserModel.findById(decoded._id);
      if (!user) {
        return res.status(404).json({
          message: 'User not found.'
        });
      }

      if (user.isVerified == true) {
        return res.status(208).json({
          message: 'Email already verified.'
        });
      }
      
      // Update only the isVerified field
      await UserModel.findByIdAndUpdate(decoded._id, { isVerified: true });

      logger.info('[UserVerifyEmail] => Verify Email process done.')
      return res.status(200).json({
        message: 'Email verified successfully.',
        success: true,
        user
      });

    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      message: 'Server error.',
      success: false
    });
  }
}

const UserReVerifyEmail = async (req, res) => {
  try {
    logger.info('[UserVerifyEmail] => User verify Email process started.')
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.', success: false });
    }

    const token = jwt.sign({ email: user.email, _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send email verification link
    const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/users/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Email Verification',
      text: `Click on this link to verify your email: ${verificationLink}`
    };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[UserVerifyEmail] => User verify Email process done.')
    return res.status(200).json({ message: 'Verification email has been resent. Note: Verification link expires in 1hr.', success: true });
  } catch (error) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({ message: 'Server error.', success: false });
  }
}

const UserLogin = async (req, res) => {
  try {
    logger.info('[UserLogin] => User login process started')
    const userFromRequest = req.body

    const user = await UserModel.findOne({
      email: userFromRequest.email,
    });
  
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      }) 
    }
  
    const validPassword = await user.isValidPassword(userFromRequest.password)

    if (!validPassword) {
      return res.status(422).json({
        message: 'Email or password is not correct',
      }) 
    }

    if (!user.isVerified) {
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/users/resend-verification-email`
      return res.status(403).json({
        message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
        success: false
      })
    }
  
    const token = await jwt.sign({ email: user.email, _id: user._id}, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' })

    logger.info('[UserLogin] => User login process done')
    return res.status(200).json({
      message: 'User login successful',
      user,
      token
    })
  } catch (error) {
      logger.error(error.message);
      return res.status(500).json({
        message: 'Server Error',
        data: null
      })
  }
}


const CreateAnniversary = async (req, res) => {
  try {
    logger.info('[CreateAnniversary] => Create anniversary process started.')

    const anniversaryFromRequest = req.body;

    // Access the authenticated (bearerToken) user's ID from req.user._id
    const userId = req.user._id;

    const existingAnniversary = await AnniversaryModel.findOne({ 
      anniversary_name: anniversaryFromRequest.anniversary_name,
      user: userId
    });

    if (existingAnniversary) {
      return res.status(409).json({
        message: 'Anniversary already exists',
      });
    }
  
    // Check if next_date is in the past
    const currentDate = new Date();
    const userNextDate = new Date(anniversaryFromRequest.next_date);

    if (userNextDate <= currentDate) {
      return res.status(400).json({
        message: 'Next date cannot be today or in the past. Please try again.',
      });
    }

    const anniversary = await AnniversaryModel.create({
      anniversary_name: anniversaryFromRequest.anniversary_name,
      user: userId, 
      next_date: anniversaryFromRequest.next_date
    });
  
    logger.info('[CreateAnniversary] => Create anniversary process done.')
    return res.status(201).json({
      message: 'Anniversary created successfully. Expect messages on the specified next date and annually.',
      anniversary
    }) 
  } catch (error) {
      console.log(error)
      return res.status(500).json({
        message: 'Server Error',
        data: null
      })
  }

}

const CreateOtherAnniversary = async (req, res) => {
  try {
    logger.info('[CreateOtherAnniversary] => Create other anniversary process started.')

    const OtherAnniversaryFromRequest = req.body;

    // Access the authenticated (bearerToken) user's ID from req.user._id
    const userId = req.user._id;

    const existingOtherAnniversary = await OtherAnniversaryModel.findOne({ 
      anniversary_name: OtherAnniversaryFromRequest.anniversary_name,
      recipient_email: OtherAnniversaryFromRequest.recipient_email,
      user: userId
    });

    if (existingOtherAnniversary) {
      return res.status(409).json({
        message: 'Anniversary already exists',
      });
    }
  
    // Check if next_date is in the past
    const currentDate = new Date();
    const userNextDate = new Date(OtherAnniversaryFromRequest.next_date);

    if (userNextDate <= currentDate) {
      return res.status(400).json({
        message: 'Next date cannot be today or in the past. Please try again.',
      });
    }

    const anniversary = await OtherAnniversaryModel.create({
      anniversary_name: OtherAnniversaryFromRequest.anniversary_name,
      recipient_name: OtherAnniversaryFromRequest.recipient_name,
      recipient_email: OtherAnniversaryFromRequest.recipient_email,
      user: userId, 
      next_date: OtherAnniversaryFromRequest.next_date
    });
  
    logger.info('[CreateOtherAnniversary] => Create other anniversary process done.')
    return res.status(201).json({
      message: 'Anniversary created successfully. Recipient will get messages on the specified next date and annually.',
      anniversary
    }) 
  } catch (error) {
      console.log(error)
      return res.status(500).json({
        message: 'Server Error',
        data: null
      })
  }

}

const UserGetAnniversaries = async (req, res) => {
  try {
    logger.info('[UserGetAnniversaries] => Get user anniversaries process started.');

    // Access the authenticated (bearerToken) user's ID from req.user._id
    const userId = req.user._id;

    const anniversaries = await AnniversaryModel.find({ user: userId });

    logger.info('[UserGetAnniversaries] => Get user anniversaries process done.');
    return res.status(200).json({
      message: 'User anniversaries retrieved successfully.',
      anniversaries
    });
  } catch (error) {
    logger.error(`[UserGetAnniversaries] => Error: ${error.message}`);
    return res.status(500).json({
      message: 'Server Error',
      error: error.message
    });
  }
};

const UserGetOtherAnniversaries = async (req, res) => {
  try {
    logger.info('[UserGetOtherAnniversaries] => User gets other anniversaries process started.');

    // Access the authenticated (bearerToken) user's ID from req.user._id
    const userId = req.user._id;

    const anniversaries = await OtherAnniversaryModel.find({ user: userId });

    logger.info('[UserGetOtherAnniversaries] => User gets other anniversaries process done.');
    return res.status(200).json({
      message: 'Other anniversaries retrieved successfully.',
      anniversaries
    });
  } catch (error) {
    logger.error(`[UserGetOtherAnniversaries] => Error: ${error.message}`);
    return res.status(500).json({
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  CreateUser,
  UserVerifyEmail,
  UserReVerifyEmail,
  UserLogin,
  CreateAnniversary,
  CreateOtherAnniversary,
  UserGetAnniversaries,
  UserGetOtherAnniversaries
}