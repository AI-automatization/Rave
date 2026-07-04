// WeWatch Mobile — Modal Stack Navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ModalStackParamList } from '@app-types/index';
import { WatchPartyCreateScreen } from '@screens/modal/WatchPartyCreateScreen';
import { WatchPartyJoinScreen } from '@screens/modal/WatchPartyJoinScreen';
import { WatchPartyScreen } from '@screens/modal/WatchPartyScreen';
import { NotificationsScreen } from '@screens/modal/NotificationsScreen';
import { SourcePickerScreen } from '@screens/modal/SourcePickerScreen';
import { MediaWebViewScreen } from '@screens/modal/MediaWebViewScreen';
import { SupportChatScreen } from '@screens/modal/SupportChatScreen';
import { DMChatScreen } from '@screens/modal/DMChatScreen';
import { FriendProfileScreen } from '@screens/friends/FriendProfileScreen';
import { PlaceholderScreen } from './PlaceholderScreen';

const Modal = createNativeStackNavigator<ModalStackParamList>();

export function ModalNavigator() {
  return (
    <Modal.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_bottom', animationDuration: 300 }}
    >
      <Modal.Screen name="SourcePicker" component={SourcePickerScreen} />
      <Modal.Screen name="MediaWebView" component={MediaWebViewScreen} options={{ animation: 'slide_from_right' }} />
      <Modal.Screen name="WatchPartyCreate" component={WatchPartyCreateScreen} />
      <Modal.Screen name="WatchPartyJoin" component={WatchPartyJoinScreen} />
      <Modal.Screen name="WatchParty" component={WatchPartyScreen} options={{ gestureEnabled: false }} />
      <Modal.Screen name="Notifications" component={NotificationsScreen} />
      <Modal.Screen name="SupportChat" component={SupportChatScreen} options={{ animation: 'slide_from_right' }} />
      <Modal.Screen name="DMChat" component={DMChatScreen} options={{ animation: 'slide_from_right' }} />
      <Modal.Screen name="FriendProfile" component={FriendProfileScreen} options={{ animation: 'slide_from_right' }} />
    </Modal.Navigator>
  );
}
