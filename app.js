const express = require('express');
const userRouter = require('./users/users-router')
const viewRouter = require('./views/views-router');
const UserModel = require('./models/user-model');
const session = require("express-session");
const flash = require("express-flash");
const bodyParser = require("body-parser");
const schedule = require('node-schedule');
const Wisher = require('./wisher')


// const jwt = require('jsonwebtoken');



require('dotenv').config();

const app = express()


app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json())

app.use(express.json());

app.use(session({
  secret:"secret_key",
  resave:false,
  saveUninitialized:true,
  // cookie:{maxAge:600000}
  cookie:{maxAge: 86400000} // 24 hours
}));

app.use(flash());

app.set('view engine', 'ejs')

app.use('/users', userRouter)

app.use('/views', viewRouter)




const job = schedule.scheduleJob('00 07 * * *', function(){
  Wisher.UserWisher()
  Wisher.OthersWisher()
  console.log('Daily Scheduled job done.', job);
});


// home route
app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'Success! Welcome to Wisher App.', 
    status: true })
})

app.get('/users', async (req, res) => {
  const users = await UserModel.find({}).lean()

  const sanitizedUsers = users.map(user => {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  });

  return res.json({
    users: sanitizedUsers
  })
})



app.get('*', (req, res) => {
  return res.status(404).json({
    data: null,
    error: 'Route not found'
  })
})

// global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    data: null,
    error: 'Server Error'
  })
})






module.exports = app