const UserModel = require('./models/user-model');
const AnniversaryModel = require('./models/anniversary-model');
const OtherAnniversaryModel = require('./models/other-anniversary-model');
const logger = require('./logger');
const nodemailer = require('nodemailer');
const Quotes = require('inspirational-quotes');




const transporter = nodemailer.createTransport({
  service: process.env.SERVICE,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});




const UserWisher = async () => {
  try {
    logger.info('[Wisher] => Wisher process started.');

    // Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
    console.log(today);
    // Find anniversaries with next_date equal to today
    const anniversaries = await AnniversaryModel.find({ next_date: today });

    if (anniversaries.length === 0) {
      logger.info('[Wisher] => No anniversaries found for today.');
      return;
    }

    // Loop through each anniversary
    for (const anniversary of anniversaries) {
      // Find user associated with the anniversary
      const user = await UserModel.findById(anniversary.user);

      if (!user) {
        logger.error('[Wisher] => User not found for anniversary:', anniversary._id);
        continue;
      }

      // Send email to the user

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
            <p><strong>Happy ${anniversary.anniversary_name} Anniversary.</strong></p>
            <p>Happy ${anniversary.anniversary_name} anniversary, ${user.first_name} ${user.last_name}!</p>
            <p>Wishing you a future filled with joy and happiness.</p>
            <p><b>Here is a quote to brighten your day:</b></p><br>
            <em>
            <p>${JSON.stringify(Quotes.getQuote()).replace(/{|}/g, '').replace(/"text":/g, '').replace(/,"author":/g, '<br>Author: ')}</p>
            </em>
            <p>Go out and make your dreams come true! All the best!</p><br>
            <b>
              <p>Wisher Team!</p>
            </b>
            
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Wisher' || process.env.EMAIL,
        from: 'Wisher',
        to: user.email,
        subject: `Happy ${anniversary.anniversary_name} Anniversary.`,
        html: htmlContent
      };
  
      // Send email using nodemailer
      await transporter.sendMail(mailOptions);

      // Update next_date to one year later
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      anniversary.next_date = nextYear;
      await anniversary.save();
      console.log(Quotes.getQuote());
      logger.info(`[Wisher] => Wished anniversary for user: ${user.email}`);
    }

    logger.info('[Wisher] => Wisher process completed.');
  } catch (error) {
    logger.error(`[Wisher] => Error: ${error.message}`);
  }
};


const OthersWisher = async () => {
  try {
    logger.info('[OthersWisher] => Others wisher process started.');

    // Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0
    console.log(today);
    // Find anniversaries with next_date equal to today
    const anniversaries = await OtherAnniversaryModel.find({ next_date: today });

    if (anniversaries.length === 0) {
      logger.info('[OthersWisher] => No anniversaries found for today.');
      return;
    }

    // Loop through each anniversary
    for (const anniversary of anniversaries) {
      // Find user associated with the anniversary
      const user = await UserModel.findById(anniversary.user);

      if (!user) {
        logger.error('[OthersWisher] => User not found for anniversary:', anniversary._id);
        continue;
      }

      // Send email to the user

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
            <p><strong>Happy ${anniversary.anniversary_name} Anniversary.</strong></p>
            <p>Happy ${anniversary.anniversary_name} anniversary, ${anniversary.recipient_name}!</p>
            <p>Wishing you a future filled with joy and happiness.</p>
            <p>${user.first_name} ${user.last_name} loves and cares about you deeply and wants the best for you.</p>
            <p><b>Here is a quote to brighten your day:</b></p><br>
            <em>
            <p>${JSON.stringify(Quotes.getQuote()).replace(/{|}/g, '').replace(/"text":/g, '').replace(/,"author":/g, '<br>Author: ')}</p>
            </em>
            <p>Go out and make your dreams come true! All the best!</p><br>
            <b>
              <p>Wisher Team!</p>
            </b>
            
          </body>
        </html>
      `
      
      const mailOptions = {
        // from: 'Wisher' || process.env.EMAIL,
        from: 'Wisher',
        to: anniversary.recipient_email,
        subject: `Happy ${anniversary.anniversary_name} Anniversary.`,
        html: htmlContent
      };
  
      // Send email using nodemailer
      await transporter.sendMail(mailOptions);

      // Update next_date to one year later
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      anniversary.next_date = nextYear;
      await anniversary.save();
      console.log(Quotes.getQuote());
      logger.info(`[OthersWisher] => Wished anniversary for user: ${user.email}`);
    }

    logger.info('[OthersWisher] => Wisher process completed.');
  } catch (error) {
    logger.error(`[OthersWisher] => Error: ${error.message}`);
  }
};

module.exports = {
  UserWisher,
  OthersWisher
};
