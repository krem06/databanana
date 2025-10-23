export const awsConfig = {
  Auth: {
    Cognito: {
      region: 'eu-west-1',
      userPoolId: 'eu-west-1_EzpGUD2LN',
      userPoolClientId: '72o7kv9qo8oc6vf7qljggo4fu8',
    }
  },
  API: {
    REST: {
      databanana: {
        endpoint: 'https://dkor79bcf8.execute-api.eu-west-1.amazonaws.com/Prod',
        region: 'eu-west-1'
      }
    }
  },
  ssr: false
}

export const apiName = 'databanana'