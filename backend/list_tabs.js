const { google } = require('googleapis');
const path = require('path');
const SHEET_URL = process.env.GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1wQvxrTXlULUTCssHwySjz8G6b-5kwBSYD6wkMx54aSk/export?format=csv';

const extractSheetId = (url) => {
  const matches = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
};

async function run() {
  const sheetId = extractSheetId(SHEET_URL);
  const keyPath = path.join(__dirname, 'google-key.json');
  console.log('Key path:', keyPath);
  
  let authClient;
  if (process.env.GOOGLE_PRIVATE_KEY) {
    try {
      let privateKey = process.env.GOOGLE_PRIVATE_KEY;
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      const creds = {
        type: process.env.GOOGLE_TYPE || "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: process.env.GOOGLE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || "googleapis.com"
      };

      authClient = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } catch (err) {
      console.warn('⚠️ Parse GOOGLE_PRIVATE_KEY in list_tabs failed:', err.message);
    }
  }

  if (!authClient && process.env.GOOGLE_CREDS) {
    try {
      const creds = JSON.parse(process.env.GOOGLE_CREDS);
      if (creds.private_key) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
      }
      authClient = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } catch (parseErr) {
      console.warn('⚠️ Parse GOOGLE_CREDS in list_tabs failed:', parseErr.message);
    }
  }

  if (!authClient && require('fs').existsSync(keyPath)) {
    authClient = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }

  if (sheetId && authClient) {
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });
      const tabNames = response.data.sheets.map(sheet => sheet.properties.title);
      console.log('Tabs in the Google Sheet:', tabNames);
    } catch (err) {
      console.error(err.message);
    }
  } else {
    console.log('No key or ID');
  }
}

run();
