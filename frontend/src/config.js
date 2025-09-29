export const awsConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_XXXXXXXXX', // Replace after deployment
      userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace after deployment
    }
  },
  API: {
    REST: {
      databanana: {
        endpoint: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/Prod', // Replace after deployment
        region: 'us-east-1'
      }
    }
  }
}