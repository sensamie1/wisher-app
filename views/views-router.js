const express = require('express');
const userService = require('../users/users-services');
const userMiddleware = require('../users/users-middleware');


const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const AnniversaryModel = require('../models/anniversary-model');
const OtherAnniversaryModel = require('../models/other-anniversary-model');

require('dotenv').config();

const router = express.Router();

router.use(cookieParser())

router.use(express.static('./views'));


// /views/ (welcome page)
router.get('/', (req, res) => {
  // If the user is already logged in, redirect to the home page
  if (req.cookies.jwt) {
    res.redirect('/views/home');
} else {
    res.render('welcome', { user: res.locals.user, });
  }
})


// /views/users (welcome page)
router.get('/users', (req, res) => {
  // If the user is already logged in, redirect to the home page
  if (req.cookies.jwt) {
    res.redirect('/views/home');
} else {
    res.render('welcome', { user: res.locals.user, });
  }
})

// /views/welcome (welcome page)
router.get('/welcome', async (req, res) => {
  // If the user is already logged in, redirect to the home page
  if (req.cookies.jwt) {
    res.redirect('/views/home');
} else {
    res.render('welcome', { user: res.locals.user, });
  }
})

// /views/users/welcome (welcome page)
router.get('/users/welcome', (req, res) => {
  // If the user is already logged in, redirect to the home page
  if (req.cookies.jwt) {
    res.redirect('home');
} else {
    res.render('welcome', { user: res.locals.user, });
  }
})


// /views/terms (terms page)
router.get('/terms', (req, res) => {
  // If the user is already logged in, redirect to the auth-terms page
  if (req.cookies.jwt) {
    res.redirect('auth-terms');
} else {
    res.render('terms', { user: res.locals.user, });
  }
})


// /views/signup (signup page)
router.get('/signup', (req, res) => {
  // If the user is already logged in, redirect to the home page
  if (req.cookies.jwt) {
    res.redirect('home');
} else {
    res.render('signup', { user: res.locals.user || null,  messages: req.flash() });
  }
})


// /views/signup (signup post request)
router.post('/signup', userMiddleware.ValidateUserCreation, async (req, res) => {
  const response = await userService.CreateUser(req.body);
  if (response.code === 200) {
    req.flash('success', 'Signup successful. Check your E-mail for verification, then you can login.');
    res.redirect('signup');
  } else if (response.code === 409) {
    req.flash('error', 'User already exists. You can login or check your E-mail for verification.');
    res.redirect('signup');
  } else {
    req.flash('error', response.message);
    res.redirect('404');
  }
});


// /views/verify-email (verification page)
router.get('/verify-email', async (req, res) => {
  const response = await userService.UserVerifyEmail(req, res)
  console.log(response);
  if (response.code === 200) {
    res.render('email-verify-success', { user: res.locals.user});
  } else if (response.code === 208) {
    res.render('email-already-verified', { user: res.locals.user});
  } else if (response.code === 401 || 410) {
    res.render('email-verify-failed', { user: res.locals.user});
  } else if (response.code === 404){
    res.render('email-verify-not-found', { user: res.locals.user});
  } else {
    res.render('404', { error: response.message })
  }
})



// /views/resend-verification-email (reverify page)
router.get('/resend-verification-email', (req, res) => {
  // If the user is already logged in, redirect to the home page
  if (req.cookies.jwt) {
    res.redirect('home');
} else {
    res.render('reverify-email', { user: res.locals.user || null,  messages: req.flash() });
  }
})


// /views/resend-verification-email (reverify post request)
router.post('/resend-verification-email', userMiddleware.UserReverifyValidation, async (req, res) => {
  const { email } = req.body;
  const response = await userService.UserReVerifyEmail(email);
  if (response.code === 200) {
    req.flash('success', 'Verification Email has been resent. Check your Email for verification, then you can login.');
    res.redirect('login');
  } else if (response.code === 404) {
    req.flash('error', 'User not found. Signup to create an account.');
    res.redirect('signup');
  } else {
    req.flash('error', response.message);
    res.redirect('404');
  }
});



// // /views/login (login page)
// router.get('/login', (req, res) => {
//   // If the user is already logged in, redirect to the home page
//   if (req.cookies.jwt) {
//     res.redirect('home');
// } else {
//     res.render('login', { user: res.locals.user || null, messages: req.flash() });
//   }
// })


// /views/login (login page)
router.get('/login', (req, res) => {
  // Check if the user JWT token exists in cookies
  if (req.cookies.jwt) {
    // Decode the JWT token to check its expiration
    const token = req.cookies.jwt;
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        // If there's an error verifying the token, clear it from cookies
        res.clearCookie('jwt');
        console.error('Error verifying token:', err);
        // Redirect to login page or handle the error as appropriate
        res.redirect('/views/login');
      } else {
        // Token is valid, check if it's expired
        if (decodedToken.exp * 1000 < Date.now()) {
          // If the token has expired, clear it from cookies
          res.clearCookie('jwt');
          // Redirect to login page
          res.redirect('/views/login');
        } else {
          // If the token is still valid, redirect to the home page
          res.redirect('home');
          return;
        }
      }
    });
  }

  // If the user JWT token doesn't exist or has expired, render the login page
  res.render('login', { user: res.locals.user || null, messages: req.flash() });
});


// /views/login (login post request)
router.post('/login', userMiddleware.UserLoginValidation, async (req, res) => {
  const response = await userService.UserLogin({ email: req.body.email, password: req.body.password })
  if (response.code === 200) {
    // set cookie
    res.cookie('jwt', response.data.token, {maxAge: 1 * 24 * 60 * 60 * 1000})
    // res.cookie('jwt', response.data.token, {maxAge: 1 * 60 * 1000})
    res.redirect('home')
  } else if (response.code === 403) {
    res.render('email-not-verified', { user: res.locals.user})
  } else if (response.code === 404) {
    req.flash('error', 'Sorry, the user details provided are invalid. Please check the details and try again.');
    res.redirect('login')
  }else if (response.code === 422) {
    req.flash('error', 'Sorry, the email or password provided is incorrect. Please check your login details and try again.');
    res.redirect('login')
  }else {
    res.render('404', { error: response.message })
  }
});


// /views/forgot-password (forgot-password page)
router.get('/forgot-password', (req, res) => {
  // If the user is already logged in, redirect to the home page
  if (req.cookies.jwt) {
    res.redirect('home');
} else {
    res.render('forgot-password', { user: res.locals.user || null, messages: req.flash() });
  }
})


// /views/forgot-password (forgot-password post request)
router.post('/forgot-password', userMiddleware.UserForgotPasswordValidation, async (req, res) => {
  const { email } = req.body;
  const response = await userService.UserForgotPassword(email)
  if (response.code === 200) {
    req.flash('success', 'Password reset email has been resent. Check you Email to change your password.');
    res.redirect('forgot-password')
  } else if (response.code === 404) {
    req.flash('error', 'User not found. Please check the Email input and try again.');
    res.redirect('forgot-password')
  }else {
    res.render('404', { error: response.message })
  }
});



// /views/reset-password (reset-password page)
router.get('/reset-password', (req, res) => {
  // If the user is already logged in, redirect to the home page
  if (req.cookies.jwt) {
    return res.redirect('home');
  }
  const token = req.query.token || req.cookies.password_jwt;
  if (!token) {
    req.flash('error', 'Reset token is missing.');
    return res.redirect('forgot-password');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    // Token is valid
    // Set JWT token in the cookie
    res.cookie('password_jwt', token, { maxAge: 5 * 60 * 1000, httpOnly: true });
    // Pass user information to the reset password page
    res.render('reset-password', { user: res.locals.user || null, token: req.query.token, messages: req.flash() });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Token has expired
      req.flash('error', 'Password reset link has expired.');
      return res.redirect('forgot-password');
    } else {
      // Other token verification errors
      console.error('Error verifying token:', error);
      req.flash('error', 'Invalid reset token.');
      return res.redirect('forgot-password');
    }
  }
});

// /views/reset-password (reset-password post request)
router.post('/reset-password', async (req, res) => {
  try {
    const token = req.cookies.password_jwt; // Access JWT token from cookie

    const newPassword = req.body.password;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const response = await userService.UserResetPassword(decoded._id, newPassword);
    console.log(response);
    if (response.code === 200) {
      req.flash('success', 'Password changed successfully. You can now login with your new password.');
      res.clearCookie('password_jwt');
      res.redirect('login');
    } else if (response.code === 400) {
      req.flash('error', 'New password must be different from the current password.')
      res.redirect('reset-password')
    } else if (response.code === 410 || response.code === 401) {
      req.flash('error', 'Invalid or expired reset link. Please try again.');
      res.redirect('forgot-password');
    } else if (response.code === 404) {
      req.flash('error', 'User not found. Please try again.');
      res.redirect('forgot-password');
    } else {
      res.render('404', { error: response.message });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    req.flash('error', 'An error occurred while resetting the password. Please try again.');
    res.redirect('forgot-password');
  }
});



// PROTECTED ROUTE
router.use(async (req, res, next) => {

  const token = req.cookies.jwt;

  if (token) {
      try {
        const decodedValue = await jwt.verify(token, process.env.JWT_SECRET);

        res.locals.user = decodedValue;
      
        next()
      } catch (error) {
        res.redirect('/views/login')
      }
  } else {
      res.redirect('/views/login')
  }
})


// /views/logout
router.get('/logout', (req, res) => {    
  res.clearCookie('jwt')
  res.redirect('login')
});


// /views/home (user logged in)
router.get('/home', (req, res) => {
  console.log({ user: res.locals.user })
  res.render('home', { user: res.locals.user });
})


// /views/auth-terms (user logged in)
router.get('/auth-terms', (req, res) => {
  console.log({ user: res.locals.user })
  res.render('auth-terms', { user: res.locals.user });
})

// /views/create-mine (user logged in)
router.get('/create-mine', (req, res) => {
  console.log({ user: res.locals.user })
  res.render('create-mine', { user: res.locals.user });
})

// /views/create-mine (create-mine post request)
router.post('/create-mine', userMiddleware.CreateAnniversaryValidation, async (req, res) => {
  // Get the user's JWT token from the cookie
  const token = req.cookies.jwt;

  // Decode the user's JWT to get the user's _id
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decodedToken._id;
  const response = await userService.CreateAnniversary(userId, req.body);
  if (response.code === 201) {
    req.flash('success', 'Anniversary created successfully. Expect messages on the specified next date and annually.');
    res.redirect('create-mine');
  } else if (response.code === 409) {
    req.flash('error', 'Anniversary already exists.');
    res.redirect('create-mine');
  } else if (response.code === 400) {
    req.flash('error', 'Next date cannot be today or in the past. Please try again.');
    res.redirect('create-mine');
  } else {
    req.flash('error', response.message);
    res.redirect('404');
  }
});

// /views/create-mine (user logged in)
router.get('/create-other', (req, res) => {
  console.log({ user: res.locals.user })
  res.render('create-other', { user: res.locals.user });
})

// /views/create-other (create-other post request)
router.post('/create-other', userMiddleware.CreateOtherAnniversaryValidation, async (req, res) => {
  // Get the user's JWT token from the cookie
  const token = req.cookies.jwt;

  // Decode the user's JWT to get the user's _id
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decodedToken._id;
  const response = await userService.CreateOtherAnniversary(userId, req.body);
  if (response.code === 201) {
    req.flash('success', 'Anniversary created successfully. Recipient will get messages on the specified next date and annually..');
    res.redirect('create-other');
  } else if (response.code === 409) {
    req.flash('error', 'Anniversary already exists.');
    res.redirect('create-other');
  } else if (response.code === 400) {
    req.flash('error', 'Next date cannot be today or in the past. Please try again.');
    res.redirect('create-other');
  } else {
    req.flash('error', response.message);
    res.redirect('404');
  }
});


// /views/my-anniversaries (Fetch user's anniversaries with pagination)
router.get('/my-anniversaries', async (req, res) => {
  try {
      // Get the user's JWT token from the cookie
      const token = req.cookies.jwt;

      // Decode the user's JWT to get the user's _id
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken._id;

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      // Find anniversaries associated with the user's _id with pagination
      const anniversaries = await AnniversaryModel.find({ user: userId })
        .sort({ created_at: -1 }) // Sort by craetes_at in descending order
        .skip(skip)
        .limit(limit);
      const totalCount = await AnniversaryModel.countDocuments({ user: userId });


      if (anniversaries.length === 0) {
        req.flash('error', 'Anniversaries not found. You have not created any anniversary.')
        res.render('my-anniversaries', {
          user: res.locals.user || null,
          anniversaries: anniversaries,
          currentPage: page,
          pages: Math.ceil(totalCount / limit)
        });
      } else {
          res.render('my-anniversaries', {
            user: res.locals.user || null,
            anniversaries: anniversaries,
            currentPage: page,
            pages: Math.ceil(totalCount / limit)
          });
      }
  } catch (err) {
      console.error('Error fetching user anniversaries:', err);
      req.flash('error', 'An error occurred while fetching anniversaries. Please try again later.');
      res.render('my-anniversaries');
  }
});

// /views/my-anniversaries (Fetch user's other anniversaries with pagination)
router.get('/other-anniversaries', async (req, res) => {
  try {
      // Get the user's JWT token from the cookie
      const token = req.cookies.jwt;

      // Decode the user's JWT to get the user's _id
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken._id;

      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      // Find other anniversaries associated with the user's _id with pagination
      const anniversaries = await OtherAnniversaryModel.find({ user: userId })
        .sort({ created_at: -1 }) // Sort by craetes_at in descending order
        .skip(skip)
        .limit(limit);
      const totalCount = await OtherAnniversaryModel.countDocuments({ user: userId });


      if (anniversaries.length === 0) {
        req.flash('error', 'Other anniversaries not found. You have not created any other anniversary.')
        res.render('other-anniversaries', {
          user: res.locals.user || null,
          anniversaries: anniversaries,
          currentPage: page,
          pages: Math.ceil(totalCount / limit)
        });
      } else {
          res.render('other-anniversaries', {
            user: res.locals.user || null,
            anniversaries: anniversaries,
            currentPage: page,
            pages: Math.ceil(totalCount / limit)
          });
      }
  } catch (err) {
      console.error('Error fetching user other anniversaries:', err);
      req.flash('error', 'An error occurred while fetching other anniversaries. Please try again later.');
      res.render('other-anniversaries');
  }
});

// /views/delete-my-anniversary
router.post('/delete-my-anniversary', async (req, res) => {
  try {
    const anniversaryId = req.body.anniversary_id;
    
    await AnniversaryModel.findByIdAndDelete(anniversaryId);

    req.flash('success', 'Anniversary deleted successfully. Refresh Page.');
    res.redirect('/views/my-anniversaries');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to delete anniversary.');
    res.redirect('/views/my-anniversaries');
  }
});

// /views/delete-other-anniversary
router.post('/delete-other-anniversary', async (req, res) => {
  try {
    const anniversaryId = req.body.anniversary_id;
    
    await OtherAnniversaryModel.findByIdAndDelete(anniversaryId);

    req.flash('success', 'Anniversary deleted successfully. Refresh Page.');
    res.redirect('/views/other-anniversaries');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to delete anniversary.');
    res.redirect('/views/other-anniversaries');
  }
});




// error page
router.get('*', (req, res) => {
  res.render('404', { user: res.locals.user || null });
})



module.exports = router;