
const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');
const app = express();
const RANGE_NAME = 'Sheet1!A1:B10';
const drive = google.drive('v3');
const sheets = google.sheets('v4')

// // Replace with your own Google OAuth credentials
const GOOGLE_CLIENT_ID = '215321644651-34frhpudrs7jl76rbd7ehisklkfejb6c.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const REDIRECT_URL = 'http://localhost:8000/auth/google/callback';
// Replace with your own Google OAuth credentials(pramit)
// const GOOGLE_CLIENT_ID = '1089254816651-ldf74v7m7mrvhdgl1ot6lqmf0l070g2s.apps.googleusercontent.com';
// const GOOGLE_CLIENT_SECRET = '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';
// const REDIRECT_URL = 'http://localhost:8000/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URL
);

const SCOPES = ['profile', 'email', "https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/forms", "https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/forms.body"];

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
  const spreadSheetName = "erpSheets"
  const formName = "testing protect"
  const type = "sheet"
  const email = "pramit1081@gmail.com"
  try {

    // sheet and forms fetch  
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const service = google.drive({ version: 'v3', auth: oauth2Client });
    const files = [];

    const folderRes = await service.files.list({
      q: `'root' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${spreadSheetName}'`,
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
    });
    Array.prototype.push.apply(files, res.files);
    folderRes.data.files.forEach(function (file) {
      console.log('Found file:', file.name, file.id);

    });
    let parentId = folderRes.data.files[0].id


    let mimeType = 'application/vnd.google-apps.form'
    const res2 = await service.files.list({
      q: `'${parentId}' in parents and mimeType = '${mimeType}' and name = '${formName}'`,
      fields: 'nextPageToken, files(*)',
      spaces: 'drive',
    });
    let outputArray = [];
    // for (let i = 0; i < res2.data.files.length; i++) {
    //   let obj = {}
    //   obj.fileName = res2.data.files[i].name,
    //     obj.fileLink = res2.data.files[i].webViewLink

    //   outputArray.push(obj)
    // }
    // sheet permitions
    let sheetId = res2.data.files[0].id


    const permissions = [
      {
        type: 'user',
        role: 'writer',
        emailAddress: "hritik.dubey@polynomial.ai", // 'user@partner.com',
      }
    ];

    let permissionIds = [];
    for (const permission of permissions) {
      try {
        const result = await service.permissions.create({
          resource: permission,
          fileId: sheetId,
          fields: 'id',
        });
        permissionIds.push(result.data.id);
        console.log(`Inserted permission id: ${result.data.id}`);
      } catch (err) {
        // TODO(developer): Handle failed permissions
        console.error(err);
      }
    }


    await setFormRestrictions()

  } catch (error) {
    console.error('Error retrieving user email:', error);
    res.status(500).send('Error retrieving user email');
  }

  // You can use the tokens to access the user's Google services

  res.redirect('http://localhost:8000/profile');
});


app.get('/profile', (req, res) => {
  // Display user profile page
  res.send('Welcome to your profile');
});

app.get('/fetchFile', async (req, res) => {
  try {
    const code = req.query.code;
    const fileType = req.query.type

    // sheet and forms fetch  
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const service = google.drive({ version: 'v3', auth: oauth2Client });
    const files = [];

    const folderRes = await service.files.list({
      q: `'root' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = 'erpSheets'`,
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
    });
    Array.prototype.push.apply(files, res.files);
    folderRes.data.files.forEach(function (file) {
      console.log('Found file:', file.name, file.id);

    });
    let parentId = folderRes.data.files[0].id
    let mimeType
    if (fileType.toLocaleLowerCase() == "sheet") {
      mimeType = 'application/vnd.google-apps.spreadsheet'
    } else {
      mimeType = 'application/vnd.google-apps.form'
    }
    const res2 = await service.files.list({
      q: `'${parentId}' in parents and mimeType = '${mimeType}'`,
      fields: 'nextPageToken, files(*)',
      spaces: 'drive',
    });
    let outputArray = [];
    for (let i = 0; i < res2.data.files.length; i++) {
      let obj = {}
      obj.fileName = res2.data.files[i].name,
        obj.fileLink = res2.data.files[i].webViewLink

      outputArray.push(obj)
    }


    res.json(outputArray);
  } catch (err) {
    res.status(500).send(err)
  }
})

// // formrestricted function
// function setFormRestrictions() {
//   var formId = '1DpjjPngO93FIoRXpxjBbQGenFfYsZfUkOVRS3p09Oow';
//   var form = FormApp.openById(formId);

//   // Set the form to accept responses again (remove form restriction)
//   form.setAcceptingResponses(true);

//   // Alternatively, you can set form restrictions like a start and end date
//   var startDate = new Date('2023-09-10');
//   var endDate = new Date('2023-09-20');
//   form.setCollectEmail(true) // Require respondents to sign in
//     .setLimitOneResponsePerUser(true)
//     .setPublishingSummary(true)
//     .setCustomClosedFormMessage('This form is closed for submissions.')
//     .setRequiresLogin(true)
//     .setAcceptingResponses(true)
//     .setDestination(FormApp.DestinationType.SPREADSHEET, '1oxbePk7Wv5Joq3nhikuDFKzCP12gzi7QJQ2lHNCuzUw');

//   // Set the form to accept responses again (remove form restriction)
//   form.setAcceptingResponses(true);

//   Logger.log('Form restrictions updated successfully.');
// }



app.post("/auth/google/fileProtect", async (req, res) => {
  try {
    const code = req.query.code;
    // const fileType = req.query.fileType;
    const fileType = req.body.fileType;
    const fileName = req.body.fileName
    const email = req.body.email
    const role = req.body.role

    // sheet and forms fetch  
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const service = google.drive({ version: 'v3', auth: oauth2Client });
    const files = [];

    const folderRes = await service.files.list({
      q: `'root' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${fileName}'`,
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
    });
    Array.prototype.push.apply(files, res.files);
    folderRes.data.files.forEach(function (file) {
      console.log('Found file:', file.name, file.id);

    });
    let parentId = folderRes.data.files[0].id
    let mimeType
    if (fileType.toLocaleLowerCase() == "sheet") {
      mimeType = 'application/vnd.google-apps.spreadsheet'
    } else {
      mimeType = 'application/vnd.google-apps.form'
    }
    const res2 = await service.files.list({
      q: `'${parentId}' in parents and mimeType = '${mimeType}' and name = '${fileName}'`,
      fields: 'nextPageToken, files(*)',
      spaces: 'drive',
    });
    // let outputArray = [];
    // for (let i = 0; i < res2.data.files.length; i++) {
    //   let obj = {}
    //   obj.fileName = res2.data.files[i].name,
    //     obj.fileLink = res2.data.files[i].webViewLink

    //   outputArray.push(obj)
    // }
    // sheet permitions
    let sheetId = res2.data.files[0].id


    const permissions = [
      {
        type: 'user',
        role: role,
        emailAddress: email,
      }
    ];

    let permissionIds = [];
    for (const permission of permissions) {
      try {
        const result = await service.permissions.create({
          resource: permission,
          fileId: sheetId,
          fields: 'id',
        });
        permissionIds.push(result.data.id);
        console.log(`Inserted permission id: ${result.data.id}`);
      } catch (err) {
        // TODO(developer): Handle failed permissions
        console.error(err);
      }
    }
    console.log("permissionIds", permissionIds)
    console.log(res2.data.files[0].id)
    res.status(200).send({ error:false,message: `authentication is shared with ${email}` })

  } catch (err) {
    res.status(500).send(err)
  }
})


app.post('/auth/google/subSheetProtect', async (req, res) => {
  const code = req.query.code;
  const spreadSheetName = req.body.spreadSheetName
  const subSheetName = req.body.subSheetName
  const type = req.body.type
  const email = req.body.email
  const role = req.body.role
  try {

    // sheet and forms fetch  
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const service = google.drive({ version: 'v3', auth: oauth2Client });
    const files = [];

    const folderRes = await service.files.list({
      q: `'root' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${spreadSheetName}'`,
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
    });
    Array.prototype.push.apply(files, res.files);
    folderRes.data.files.forEach(function (file) {
      console.log('Found file:', file.name, file.id);

    });
    let parentId = folderRes.data.files[0].id


    let mimeType = 'application/vnd.google-apps.spreadsheet'
    const res2 = await service.files.list({
      q: `'${parentId}' in parents and mimeType = '${mimeType}'`,
      fields: 'nextPageToken, files(*)',
      spaces: 'drive',
    });
    let testEmailAlredyShared = res2.data.files[0].permissions.filter((ele) => {
      return ele.emailAddress == email
    })
    if (testEmailAlredyShared.length==0) {
      let sheetId = res2.data.files[0].id

      const permissions = [
        {
          type: 'user',
          role: role,
          emailAddress: email,
        }
      ];

      let permissionIds = [];
      for (const permission of permissions) {
        try {
          const result = await service.permissions.create({
            resource: permission,
            fileId: sheetId,
            fields: 'id',
          });
          permissionIds.push(result.data.id);
          console.log(`Inserted permission id: ${result.data.id}`);
        } catch (err) {
          // TODO(developer): Handle failed permissions
          console.error(err);
        }
      }
    }

    // sheet permitions
    let spreadsheetId = res2.data.files[0].id

    const sheetsAPI = await sheets.spreadsheets.get({
      auth: oauth2Client,
      spreadsheetId: spreadsheetId,
    });
    // const subSheetName = "order schedule"
    console.log(sheetsAPI.data.sheets)
    let subSheets = sheetsAPI.data.sheets;
    let filterSubSheet = subSheets.filter((ele) => {
      return ele.properties.title == subSheetName
    })

    let requests = [];
    if (filterSubSheet[0].protectedRanges && filterSubSheet[0].protectedRanges.length > 0) {
      filterSubSheet[0].protectedRanges[0].editors.users.push(email)
      let protectedRangeId = filterSubSheet[0].protectedRanges[0].protectedRangeId
      let object = {
        updateProtectedRange: {
          protectedRange: {
            protectedRangeId: protectedRangeId,
            range: {
              sheetId: filterSubSheet[0].properties.sheetId
            },
            requestingUserCanEdit: true,
            editors: {
              users: filterSubSheet[0].protectedRanges[0].editors.users,
              domainUsersCanEdit: true
            }
          },
          fields: "*"
        },
      }
      requests.push(object)

    } else {
      let object = {
        addProtectedRange: {
          protectedRange: {
            range: {
              sheetId: filterSubSheet[0].properties.sheetId
            },
            editors: {
              users: [email],
              domainUsersCanEdit: true
            }
          },
        },
      }
      requests.push(object)
    }

    // let data ={
    //   deleteProtectedRange: {
    //     protectedRangeId: filterSubSheet[0].protectedRanges[0].protectedRangeId
    //   }
    // }
    // const range = { sheetId: filterSubSheet[0].properties.sheetId };
    // const editors = { users: [email], domainUsersCanEdit: true };
    const request = {
      auth: oauth2Client,
      spreadsheetId: spreadsheetId,
      resource: {
        requests,
      },
    };
    const response = await sheets.spreadsheets.batchUpdate(request);
    console.log(response)

    res.status(200).send({ error:false,message: `authentication is shared with ${email}` })
  } catch (error) {
    console.error('Error retrieving user email:', error);
    res.status(500).send('Error retrieving user email');
  }
})




app.listen(8000, () => {
  console.log('Server started on http://localhost:8000');
});






























































async function handleAuthorizationAndProtection(req, res) {
  try {
    const code = req.query.code;
    const spreadSheetName = "erpSheets";
    const subSheetName = "Sheet3";
    const type = "sheet";
    const email = "pramit1081@gmail.com";

    // OAuth2 authorization
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const driveService = google.drive({ version: 'v3', auth: oauth2Client });

    // Check the fileType and fileName condition
    let mimeType;
    let fileName;

    if (type.toLowerCase() === "sheet") {
      mimeType = 'application/vnd.google-apps.spreadsheet';
      fileName = "authentication check";
    } else {
      // Handle other file types if needed
      // mimeType = ...;
      // fileName = ...;
    }

    // Find the parent folder
    const folderRes = await driveService.files.list({
      q: `'root' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${spreadSheetName}'`,
      fields: 'nextPageToken, files(id, name)',
      spaces: 'drive',
    });

    const parentId = folderRes.data.files[0].id;

    // Find the spreadsheet
    const spreadsheetRes = await driveService.files.list({
      q: `'${parentId}' in parents and mimeType = '${mimeType}' and name = '${fileName}'`,
      fields: 'nextPageToken, files(id)',
      spaces: 'drive',
    });

    if (spreadsheetRes.data.files.length === 0) {
      res.status(404).send('Spreadsheet not found');
      return;
    }

    const spreadsheetId = spreadsheetRes.data.files[0].id;

    // Fetch existing protected ranges
    const sheetsAPI = await sheets.spreadsheets.get({
      auth: oauth2Client,
      spreadsheetId: spreadsheetId,
    });

    const subSheets = sheetsAPI.data.sheets;
    const filterSubSheet = subSheets.find((ele) => ele.properties.title === subSheetName);

    if (!filterSubSheet) {
      res.status(404).send('Subsheet not found');
      return;
    }

    const protectedRanges = filterSubSheet.protectedRanges || [];

    // Prepare permissions
    const permissions = [
      {
        type: 'user',
        role: 'writer',
        emailAddress: email,
      },
    ];

    // Create or update protected range
    const requests = [];

    if (protectedRanges.length > 0) {
      // Update existing protected range
      const existingRange = protectedRanges[0];
      existingRange.editors.users.push(email);

      requests.push({
        updateProtectedRange: {
          protectedRange: {
            protectedRangeId: existingRange.protectedRangeId,
            range: {
              sheetId: filterSubSheet.properties.sheetId,
            },
            requestingUserCanEdit: true,
            editors: {
              users: existingRange.editors.users,
              domainUsersCanEdit: true,
            },
          },
          fields: '*',
        },
      });
    } else {
      // Create a new protected range
      requests.push({
        addProtectedRange: {
          protectedRange: {
            range: {
              sheetId: filterSubSheet.properties.sheetId,
            },
            editors: {
              users: [email],
              domainUsersCanEdit: true,
            },
          },
        },
      });
    }

    // Batch update
    const batchUpdateRequest = {
      auth: oauth2Client,
      spreadsheetId: spreadsheetId,
      resource: {
        requests,
      },
    };

    const batchUpdateResponse = await sheets.spreadsheets.batchUpdate(batchUpdateRequest);
    console.log(batchUpdateResponse);

    res.send('Protection part is done');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error occurred');
  }
}

// Define your Express route for this function
app.get('/auth/google/callback', handleAuthorizationAndProtection);
