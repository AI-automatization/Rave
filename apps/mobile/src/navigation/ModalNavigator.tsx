// CineSync Mobile — Modal Stack Navigator
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ModalStackParamList } from '@app-types/index';
import { WatchPartyCreateScreen } from '@screens/modal/WatchPartyCreateScreen';
import { WatchPartyScreen } from '@screens/modal/WatchPartyScreen';
import { PlaceholderScreen } from './PlaceholderScreen';

const Modal = createNativeStackNavigator<ModalStackParamList>();

export function ModalNavigator() {
  return (
    <Modal.Navigator screenOptions={{ headerShown: false }}>
      <Modal.Screen name="WatchPartyCreate" component={WatchPartyCreateScreen} />
      <Modal.Screen name="WatchParty" component={WatchPartyScreen} />
      <Modal.Screen name="BattleCreate" component={PlaceholderScreen} />
      <Modal.Screen name="Battle" component={PlaceholderScreen} />
      <Modal.Screen name="Notifications" component={PlaceholderScreen} />
    </Modal.Navigator>
  );
}
