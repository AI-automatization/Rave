import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

// TODO: Firebase — google-services.json o'rnatilgandan keyin quyidagi qatorlarni qaytaring:
// import messaging from '@react-native-firebase/messaging';
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   if (__DEV__) console.log('[FCM] Background message:', remoteMessage);
// });

AppRegistry.registerComponent(appName, () => App);
