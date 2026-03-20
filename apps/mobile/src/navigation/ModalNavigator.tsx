// CineSync Mobile — Modal Stack Navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ModalStackParamList } from '@app-types/index';
import { WatchPartyCreateScreen } from '@screens/modal/WatchPartyCreateScreen';
import { WatchPartyJoinScreen } from '@screens/modal/WatchPartyJoinScreen';
import { WatchPartyScreen } from '@screens/modal/WatchPartyScreen';
import { BattleCreateScreen } from '@screens/modal/BattleCreateScreen';
import { BattleScreen } from '@screens/modal/BattleScreen';
import { NotificationsScreen } from '@screens/modal/NotificationsScreen';
import { PlaceholderScreen } from './PlaceholderScreen';

const Modal = createNativeStackNavigator<ModalStackParamList>();

export function ModalNavigator() {
  return (
    <Modal.Navigator screenOptions={{ headerShown: false }}>
      <Modal.Screen name="WatchPartyCreate" component={WatchPartyCreateScreen} />
      <Modal.Screen name="WatchPartyJoin" component={WatchPartyJoinScreen} />
      <Modal.Screen name="WatchParty" component={WatchPartyScreen} options={{ gestureEnabled: false }} />
      <Modal.Screen name="BattleCreate" component={BattleCreateScreen} />
      <Modal.Screen name="Battle" component={BattleScreen} />
      <Modal.Screen name="Notifications" component={NotificationsScreen} />
    </Modal.Navigator>
  );
}
