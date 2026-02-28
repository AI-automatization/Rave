import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './src/App';
import { name as appName } from './app.json';

// Background FCM handler — must be registered before AppRegistry
messaging().setBackgroundMessageHandler(async remoteMessage => {
  if (__DEV__) console.log('[FCM] Background message:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
