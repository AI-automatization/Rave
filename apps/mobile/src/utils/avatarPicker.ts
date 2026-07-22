// WeWatch Mobile — shared avatar image picker.
// Presents a camera / gallery choice, requests the matching permission,
// launches the picker, and resolves with the chosen asset (or null if the
// user cancels or denies permission). Centralises the flow shared by
// ProfileSetupScreen and ProfileScreen so camera + gallery logic lives once.
import * as ImagePicker from 'expo-image-picker';
import { appAlert } from '@components/common/AppAlert';
import { t } from '@i18n/translations';
import { useLanguageStore } from '@store/language.store';

const EDIT_OPTS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

type Source = 'camera' | 'gallery';

async function launch(source: Source): Promise<ImagePicker.ImagePickerAsset | null> {
  const lang = useLanguageStore.getState().lang;

  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      appAlert(t('common', 'error', lang), t('profile', 'cameraPermission', lang));
      return null;
    }
    const result = await ImagePicker.launchCameraAsync(EDIT_OPTS);
    return result.canceled ? null : result.assets[0] ?? null;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    appAlert(t('common', 'error', lang), t('profile', 'galleryPermission', lang));
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync(EDIT_OPTS);
  return result.canceled ? null : result.assets[0] ?? null;
}

/**
 * Ask the user to choose camera or gallery, then pick a square avatar image.
 * Resolves with the selected asset, or null if cancelled / permission denied.
 */
export function pickAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
  const lang = useLanguageStore.getState().lang;
  return new Promise((resolve) => {
    appAlert(t('profile', 'photoSourceTitle', lang), undefined, [
      { text: t('profile', 'photoFromCamera', lang), onPress: () => resolve(launch('camera')) },
      { text: t('profile', 'photoFromGallery', lang), onPress: () => resolve(launch('gallery')) },
      { text: t('common', 'cancel', lang), style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
