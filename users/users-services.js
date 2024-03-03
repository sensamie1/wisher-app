const UserModel = require('../models/user-model');
const AnniversaryModel = require('../models/anniversary-model');
const OtherAnniversaryModel = require('../models/other-anniversary-model');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');



const transporter = nodemailer.createTransport({
  service: process.env.SERVICE,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});


const CreateUser = async (user) => {
  try {
    logger.info('[CreateUser] => Create user process started...')
    const userFromRequest = user;

    const newUser = new UserModel();

    newUser.first_name = userFromRequest.first_name;
    newUser.last_name = userFromRequest.last_name;
    newUser.email = userFromRequest.email;
    newUser.password = userFromRequest.password;
    newUser.confirm_password = userFromRequest.confirm_password;

    const existingUser = await UserModel.findOne({
      email: userFromRequest.email,
    });

    if (existingUser) {
      return {
        message: 'User already exists.',
        code: 409
      }
    }

    const savedUser = await newUser.save();

    const token = await jwt.sign({ email: savedUser.email, _id: savedUser._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

      // Send email verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/verify-email?token=${token}`;
      
      const htmlContent = `
        <html>
          <head>
            <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              text-align: center;
            }
      
            .logo-image {
              display: block;
              width: 200px;
              height: auto;
              border-radius: 5px;
              margin-top: 20px;
            }
      
            button {
              background-color: #543006ef;
              color: #fff;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }
      
            button:hover {
              background-color: #a28461ef;
            }
      
            p {
              margin-top: 20px;
              font-size: 18px;
            }
      
            a {
              color: #fff;
              text-decoration: none;
            }
            </style>
          </head>
          <body>
            <img src="https://res.cloudinary.com/ddi6arl8i/image/upload/v1709236164/wisher-logo_psxaoh.png" alt="Wisher Logo" class="logo-image">
            <p><strong>Welcome to Wisher App.</strong></p>
            <p>Your signup was successful.</p>
            <p>Click on this link to verify your email:</p>
            <button><a href="${verificationLink}" style="color: #fff;">Verify</a></button>
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Wisher' || process.env.EMAIL,
        from: 'Wisher',
        to: user.email,
        subject: 'Email Verification',
        html: htmlContent
      };
  
      // Send email using nodemailer
      await transporter.sendMail(mailOptions);

    logger.info('[CreateUser] => Create user process done.')
    return {
      code: 200,
      success: true,
      message: 'User created successfully.',
      data: {
        user: savedUser
      }
    }
  } catch (error) {
    console.log(error)
    return {
      message: 'Server Error',
      code: 500,
      data: null
    }}
}   

const UserVerifyEmail = async (req, res) => {
  try {
    logger.info('[UserVerifyEmail] => User verify Email process started.')
    const token = req.query.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await UserModel.findById(decoded._id);
    if (!user) {
      return {
        message: 'User not found.',
        code: 404,
      };
    }
    if (user.isVerified) {
      return {
        message: 'Email already verified.',
        code: 208
      };
    }

    // Update only the isVerified field
    await UserModel.findByIdAndUpdate(decoded._id, { isVerified: true });

    logger.info('[UserVerifyEmail] => User verify Email process done.')
    return {
      message: 'Email verified successfully.',
      code: 200
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        message: 'Verification link has expired.',
        code: 401
      };
    } else {
      console.error('Error in verifying email:', error);
      return {
        message: 'Invalid verification link.',
        code: 410
      };
    }
  }
}

const UserReVerifyEmail = async (email) => {
  try {
    logger.info('[UserReVerifyEmail] => User reverify Email process started.')
    const user = await UserModel.findOne({ email });

    if (!user) {
      return {
        message: 'User not found.',
        code: 404, 
        success: false
      };
    }

    const token = await jwt.sign({ email: user.email, _id: user._id}, process.env.JWT_SECRET, { expiresIn: '1h' })

      // Send email verification link
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/verify-email?token=${token}`;
      
      const htmlContent = `
        <html>
          <head>
            <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              text-align: center;
            }
      
            .logo-image {
              display: block;
              width: 200px;
              height: auto;
              border-radius: 5px;
              margin-top: 20px;
            }
      
            button {
              background-color: #543006ef;
              color: #fff;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }
      
            button:hover {
              background-color: #a28461ef;
            }
      
            p {
              margin-top: 20px;
              font-size: 18px;
            }
      
            a {
              color: #fff;
              text-decoration: none;
            }
            </style>
          </head>
          <body>
            <img src="https://res.cloudinary.com/ddi6arl8i/image/upload/v1709236164/wisher-logo_psxaoh.png" alt="Wisher Logo" class="logo-image">
            <p><strong>Welcome to Wisher App.</strong></p>
            <p>Your signup was successful.</p>
            <p>Click on this link to verify your email:</p>
            <button><a href="${verificationLink}" style="color: #fff;">Verify</a></button>
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Wisher' || process.env.EMAIL,
        from: 'Wisher',
        to: user.email,
        subject: 'Email Verification',
        html: htmlContent
      };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[UserReVerifyEmail] => User reverify Email process done.')
    return {
      message: 'Verification email has been resent.', 
      code: 200,
      success: true 
    };
  } catch (error) {
    console.error('Resend verification email error:', error);
    return { 
      message: 'Server error.',
      code: 500, 
      success: false 
    };
  }
}


const UserLogin = async ({ email, password }) => {
  try {
    logger.info('[UserLogin] => User login process started...')
    const userFromRequest = { email, password }

    const user = await UserModel.findOne({
      email: userFromRequest.email
    });

    if (!user) { 
      return {
        message: 'User not found',
        code: 404
      }
    }

    const validPassword = await user.isValidPassword(userFromRequest.password)

    if (!validPassword) {
      return {
        message: 'Email or password incorrect',
        code: 422,
      }
    }

    if (!user.isVerified) {
      const verificationLink = `http://${process.env.HOST}:${process.env.PORT}/views/resend-verification-email`
      return {
        message: `Email not verified. Check your Email for verification link or request a new one here - ${verificationLink}`,
        verificationLink,
        code: 403,
      }
    }
    
    const token = await jwt.sign({ 
      email: user.email, 
      _id: user._id,
      first_name: user.first_name, 
      last_name: user.last_name}, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' })
    logger.info('[UserLogin] => User login process done.')
    return {
    message: 'Login successful',
    code: 200,
    data: {
      user,
      token
    }
    }
  } catch (error) {
    logger.error(error.message);
      return{
        message: 'Server Error',
        data: null
      }
  }
  
}

const UserForgotPassword = async (email) => {
  try {
    logger.info('[UserForgotPassword] => User forgot password process started.')

    const user = await UserModel.findOne({ email });
  
    if (!user) {
      return {
        message: 'User not found.',
        code: 404, 
        success: false
      };
    }
  
    const token = await jwt.sign({ email: user.email, _id: user._id}, process.env.JWT_SECRET, { expiresIn: '5m' })
  
      // Send email password reset link
      const resetLink = `http://${process.env.HOST}:${process.env.PORT}/views/reset-password?token=${token}`;
      
      const htmlContent = `
        <html>
          <head>
            <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              text-align: center;
            }
      
            .logo-image {
              display: block;
              width: 200px;
              height: auto;
              border-radius: 5px;
              margin-top: 20px;
            }
      
            button {
              background-color: #543006ef;
              color: #fff;
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }
      
            button:hover {
              background-color: #a28461ef;
            }
      
            p {
              margin-top: 20px;
              font-size: 18px;
            }
      
            a {
              color: #fff;
              text-decoration: none;
            }
            </style>
          </head>
          <body>
            <img src="https://res.cloudinary.com/ddi6arl8i/image/upload/v1709236164/wisher-logo_psxaoh.png" alt="Wisher Logo" class="logo-image">
            <p><strong>Password Reset.</strong></p>
            <p>You requested for password reset.</p>
            <p>Click on this link to change your password:</p>
            <button><a href="${resetLink}" style="color: #fff;">Reset</a></button>
            <p>If you did not request a password change, ignore this message. Password reset link expires in 5min.</p>
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Wisher' || process.env.EMAIL,
        from: 'Wisher',
        to: user.email,
        subject: 'Password Reset',
        html: htmlContent
      };

    // Send email using nodemailer
    await transporter.sendMail(mailOptions);

    logger.info('[UserForgotPassword] => User forgot password process done.')
    return {
      message: 'Password reset email has been resent.', 
      code: 200,
      success: true 
    };

  } catch (error) {
      console.error(error);
      return {
        message: 'Server Error',
        data: null
      };
    }
}

const UserResetPassword = async (_id, newPassword) => {
  try {
    logger.info('[UserResetPassword] => User reset password process started.')

    const user = await UserModel.findById(_id);
    if (!user) {
      return {
        message: 'User not found.',
        code: 404,
      };
    }

    // Check if the new password is the same as the current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return {
        message: 'New password must be different from the current password.',
        code: 400,
      };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update only the password field
    await UserModel.findByIdAndUpdate(_id, { password: hashedPassword });

    logger.info('[UserResetPassword] => User reset password process done.')
    return {
      message: 'Password changed successfully.',
      code: 200
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        message: 'Password reset link has expired.',
        code: 401
      };
    } else {
      console.error('Password reset error:', error);
      return {
        message: 'Invalid reset link.',
        code: 410
      };
    }
  }
}

const CreateAnniversary = async (userId, anniversaryFromRequest) => {
  try {
    logger.info('[CreateAnniversary] => Create anniversary process started.')

    

    const existingAnniversary = await AnniversaryModel.findOne({ 
      anniversary_name: anniversaryFromRequest.anniversary_name,
      user: userId
    });

    if (existingAnniversary) {
      return {
        message: 'Anniversary already exists',
        code: 409
      };
    }
  
    // Check if next_date is in the past
    const currentDate = new Date();
    const userNextDate = new Date(anniversaryFromRequest.next_date);

    if (userNextDate <= currentDate) {
      return{
        message: 'Next date cannot be today or in the past. Please try again.',
        code: 400
      };
    }

    const anniversary = await AnniversaryModel.create({
      anniversary_name: anniversaryFromRequest.anniversary_name,
      user: userId, 
      next_date: anniversaryFromRequest.next_date
    });
  
    logger.info('[CreateAnniversary] => Create anniversary process done.')
    return{
      message: 'Anniversary created successfully. Expect messages on the specified next date and annually.',
      anniversary,
      code: 201
    }
  } catch (error) {
      console.log(error)
      return {
        message: 'Server Error',
        code: 500,
        data: null
      }
  }

}

const CreateOtherAnniversary = async (userId, OtherAnniversaryFromRequest) => {
  try {
    logger.info('[CreateOtherAnniversary] => Create other anniversary process started.')


    const existingOtherAnniversary = await OtherAnniversaryModel.findOne({ 
      anniversary_name: OtherAnniversaryFromRequest.anniversary_name,
      recipient_email: OtherAnniversaryFromRequest.recipient_email,
      user: userId
    });

    if (existingOtherAnniversary) {
      return {
        message: 'Anniversary already exists',
        code: 409
      };
    }
  
    // Check if next_date is in the past
    const currentDate = new Date();
    const userNextDate = new Date(OtherAnniversaryFromRequest.next_date);

    if (userNextDate <= currentDate) {
      return{
        message: 'Next date cannot be today or in the past. Please try again.',
        code: 400
      };
    }

    const anniversary = await OtherAnniversaryModel.create({
      anniversary_name: OtherAnniversaryFromRequest.anniversary_name,
      recipient_name: OtherAnniversaryFromRequest.recipient_name,
      recipient_email: OtherAnniversaryFromRequest.recipient_email,
      user: userId, 
      next_date: OtherAnniversaryFromRequest.next_date
    });
  
    logger.info('[CreateOtherAnniversary] => Create other anniversary process done.')
    return {
      message: 'Anniversary created successfully. Recipient will get messages on the specified next date and annually.',
      anniversary,
      code: 201
    }
  } catch (error) {
      console.log(error)
      return{
        message: 'Server Error',
        code: 500,
        data: null
      }
  }

}

const GetMyAnniversaries = async (userId) => {
  try {
    logger.info('[GetMyAnniversaries] => User get my anniversaries process started...');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Find all anniversaries associated with the user's _id
    const anniversaries = await AnniversaryModel.find({ user: userId }).skip(skip).limit(limit);
    if (!anniversaries) {
      return {
        message: 'Anniversaries not found.',
        code: 404,
      };
    }

    const totalCount = await AnniversaryModel.countDocuments({userId});


    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) {
      return {
        code: 200,
        message: 'No more pages',
        currentPage: page,
        totalPages: totalPages,
      }
    }
    
    logger.info('[GetMyAnniversaries] => User get my anniversaries process done.');
    return {
      code: 200,
      message: 'Anniversaries fetched successfully',
      anniversaries,
      currentPage: page,
      totalPages: totalPages,
    }
  } catch (error) {
    return {
      code: 500,
      message: 'Server Error',
      data: null,
    }
  }
};

const GetOtherAnniversaries = async (userId) => {
  try {
    logger.info('[GetOtherAnniversaries] => User get other anniversaries process started...');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Find all other anniversaries associated with the user's _id
    const anniversaries = await OtherAnniversaryModel.find({ user: userId }).skip(skip).limit(limit);
    if (!anniversaries) {
      return {
        message: 'Other anniversaries not found.',
        code: 404,
      };
    }

    const totalCount = await OtherAnniversaryModel.countDocuments({userId});


    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) {
      return {
        code: 200,
        message: 'No more pages',
        currentPage: page,
        totalPages: totalPages,
      }
    }
    
    logger.info('[GetOtherAnniversaries] => User get other anniversaries process done.');
    return {
      code: 200,
      message: 'Other anniversaries fetched successfully',
      anniversaries,
      currentPage: page,
      totalPages: totalPages,
    }
  } catch (error) {
    return {
      code: 500,
      message: 'Server Error',
      data: null,
    }
  }
};

module.exports = {
  CreateUser,
  UserVerifyEmail,
  UserReVerifyEmail,
  UserLogin,
  UserForgotPassword,
  UserResetPassword,
  CreateOtherAnniversary,
  CreateAnniversary,
  GetMyAnniversaries,
  GetOtherAnniversaries
}