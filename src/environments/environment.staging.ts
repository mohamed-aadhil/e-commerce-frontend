export const environment = {
  production: false,
  apiUrl: 'https://staging-api.yourdomain.com', // Replace with your staging API URL
  withCredentials: true,
  environmentName: 'staging',
  version: require('../../package.json').version + '-staging'
};
