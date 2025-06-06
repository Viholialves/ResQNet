import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';

export async function solicitarPermissaoFirebase() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Permissão de notificação do Firebase concedida!');
  } else {
    console.log('Permissão de notificação do Firebase negada.');
  }
}

export function escutarMensagens() {
  messaging().onMessage(async remoteMessage => {
    Alert.alert(
      remoteMessage.notification?.title ?? 'Notificação',
      remoteMessage.notification?.body ?? 'Você recebeu uma mensagem.'
    );
  });
}

export async function obterToken() {
  const token = await messaging().getToken();
  console.log('Token FCM:', token);
  return token;
}
