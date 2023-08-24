// const express = require('express');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const session = require('express-session'); // Import express-session

// const app = express();

// // Replace with your own Google OAuth credentials
// const GOOGLE_CLIENT_ID = '401126326913-mfv3iq0hoked99jljckhsh6gcoe4765t.apps.googleusercontent.com';
// const GOOGLE_CLIENT_SECRET = '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';

// // Set up Google OAuth strategy
// passport.use(new GoogleStrategy({
//   clientID: GOOGLE_CLIENT_ID,
//   clientSecret: GOOGLE_CLIENT_SECRET,
//   callbackURL: 'http://localhost:8000/auth/google/callback',
//   // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
// }, (accessToken, refreshToken, profile, done) => {
//   // Handle user profile data
//   // 'profile' contains user information
// }));
// app.use(session({
//     secret: GOOGLE_CLIENT_SECRET, // Change this to a secure secret
//     resave: false,
//     saveUninitialized: true
//   }));
// app.use(passport.initialize());
// app.use(passport.session());

// // Authentication route
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// // Callback route
// app.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     // Successful authentication
//     console.log("callback url")
//     res.redirect('http://localhost:8000/profile');
//   }
// );

// app.get('/profile', (req, res) => {
//   // Display user profile page
//   res.send('Welcome to your profile');
// });

// app.listen(8000, () => {
//   console.log('Server started on http://localhost:8000');
// });


const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');

const app = express();

// Replace with your own Google OAuth credentials
const GOOGLE_CLIENT_ID = '215321644651-34frhpudrs7jl76rbd7ehisklkfejb6c.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const REDIRECT_URL = 'https://erp-40sp.onrender.com/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URL
);

const SCOPES = ['profile', 'email'];

app.use(session({
  secret: GOOGLE_CLIENT_SECRET, // Change this to a secure secret
  resave: false,
  saveUninitialized: true
}));

app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // You can use the tokens to access the user's Google services

  res.redirect('https://erp-40sp.onrender.com/profile');
});

app.get('/profile', (req, res) => {
  // Display user profile page
  res.send('Welcome to your profile');
});

app.listen(8000, () => {
  console.log('Server started on http://localhost:8000');
});
