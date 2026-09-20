import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.85,
  base64: true,
  allowsEditing: false,
};

/** Opens the device camera. Returns the captured asset, or null if cancelled/denied. */
export async function takePhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Camera access needed', 'Enable camera access in Settings to take photos.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync(pickerOptions);
  if (result.canceled) return null;
  return result.assets[0];
}

/** Opens the photo library. Returns the selected asset, or null if cancelled/denied. */
export async function pickFromLibrary(): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Photos access needed', 'Enable photo access in Settings to choose a photo.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
  if (result.canceled) return null;
  return result.assets[0];
}
