
const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const fs = require('fs');

const app = express();
const RANGE_NAME = 'Sheet1!A1:B10';

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
  const code = req.query.code;

  try {
    const { tokens } = oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const people = google.people({ version: 'v1', auth: oauth2Client });
    const { data } = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses'
    });
    console.log("data", data)
    const userEmail = data.emailAddresses[0].value;
    console.log("userEmail", userEmail)
    // Now you can send the userEmail to the frontend
    res.send({ email: userEmail });
  } catch (error) {
    console.error('Error retrieving user email:', error);
    res.status(500).send('Error retrieving user email');
  }

  // You can use the tokens to access the user's Google services

  res.redirect('https://erp-40sp.onrender.com/profile');
});

app.get('/profile', (req, res) => {
  // Display user profile page
  res.send('Welcome to your profile');
});




// // get all sheet 
// app.get('/sheets', async (req, res) => {
//   try {

//     const credentials = {
//       client_email: "pramit@polynomial.ai"
//     };
//     const drive = new GoogleDrive(auth.getCredentials(credentials));


//   } catch (err) {
//     console.log(err)
//   }
// })



app.listen(8000, () => {
  console.log('Server started on http://localhost:8000');
});
