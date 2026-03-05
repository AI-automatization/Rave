import { registerRootComponent } from 'expo';
import App from './src/App';

// Firebase background handler
// google-services.json o'rnatilgandan keyin quyidagi qatorlarni qaytaring:
// import messaging from '@react-native-firebase/messaging';
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   if (__DEV__) console.log('[FCM] Background message:', remoteMessage);
// });

registerRootComponent(App);
