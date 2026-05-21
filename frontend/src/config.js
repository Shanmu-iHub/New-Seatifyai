const APP_MODE = process.env.REACT_APP_MODE 

const API_URLS = {
  development: 'http://localhost:5000',
  live: 'https://api1.seatifyai.com',
};

const config = {
  MODE: APP_MODE,
  API_URL: APP_MODE === 'development' ? API_URLS.development : API_URLS.live,
};

export default config;
