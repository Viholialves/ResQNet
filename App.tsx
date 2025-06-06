import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  StatusBar,
  PermissionsAndroid,
  Platform,
  Alert,
  AppRegistry,
  ActivityIndicator,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { name as appName } from './app.json';

import HomeScreen from './screens/HomeScreen';
import AbrigosScreen from './screens/AbrigoScreen';
import ComLocalScreen from './screens/comLocalScreen';
import MapScreen from './screens/MapsScreen';
import InfoScreen from './screens/infScreen';
import MissionsScreen from './screens/MissionsScreen';

import { API_KEY, API_URL } from './var_ambiente';

export type RootStackParamList = {
  HomeScreen: undefined;
  AbrigosScreen: undefined;
  ComLocalScreen: undefined;
  MapScreen: undefined;
  InfoScreen: undefined;
  MissionsScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

AppRegistry.registerComponent(appName, () => App);

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Mensagem recebida em background:', remoteMessage);

  await notifee.displayNotification({
    title: remoteMessage.notification?.title ?? 'Notificação',
    body: remoteMessage.notification?.body ?? '',
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_notification',
    },
  });
});

const REGIOES = ['CTR', 'ZN', 'ZS', 'ZL', 'ZO', 'RM'];

let resolveRegiao: ((regiao: string) => void) | null = null;
let showModal: (() => void) | null = null;

const RegiaoModal = ({ visible, onSelect }: { visible: boolean; onSelect: (regiao: string) => void }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Selecione sua região</Text>
        <FlatList
          data={REGIOES}
          keyExtractor={item => item}
          numColumns={4}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.estadoButton} onPress={() => onSelect(item)}>
              <Text style={styles.estadoText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

function useRegiaoModal() {
  const [visible, setVisible] = useState(false);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const handleSelect = async (regiao: string) => {
    hide();
      try {
        await AsyncStorage.setItem('regiao', regiao); // <-- salvar aqui
      } catch (error) {
        console.error('Erro ao salvar região:', error);
        Alert.alert('Erro', 'Falha ao salvar a região selecionada.');
      }
    if (resolveRegiao) {
      resolveRegiao(regiao);
      resolveRegiao = null;
    }
  };

  return {
    modal: <RegiaoModal visible={visible} onSelect={handleSelect} />,
    show,
  };
}

export async function defRegiao() {
  try {
    const storedRegiao = await AsyncStorage.getItem('regiao');
    if (storedRegiao) return storedRegiao;

    return await new Promise<string>((resolve) => {
      resolveRegiao = resolve;
      if (showModal) showModal();
    });
  } catch (error) {
    console.error('Erro ao obter região:', error);
    Alert.alert('Erro', 'Não foi possível obter a região definida.');
    return 'NONE';
  }
}

export async function changeRegiao() {
  try {
    return await new Promise<string>((resolve) => {
      resolveRegiao = resolve;
      if (showModal) showModal();
    });
  } catch (error) {
    console.error('Erro ao mudar região:', error);
    Alert.alert('Erro', 'Não foi possível mudar a região.');
    return 'NONE';
  }
}

export const RegiaoModalProvider = ({ children }: { children: React.ReactNode }) => {
  const { modal, show } = useRegiaoModal();

  useEffect(() => {
    showModal = show;
    return () => {
      showModal = null;
    };
  }, [show]);

  return (
    <>
      {children}
      {modal}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    width: 320,
    alignItems: 'center',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  estadoButton: {
    margin: 6,
    padding: 12,
    backgroundColor: '#1976d2',
    borderRadius: 6,
    minWidth: 48,
    alignItems: 'center',
  },
  estadoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export async function updateTokenToServer(token: string, regiao: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    if (regiao === 'NONE') {
      Alert.alert('Região não definida', 'Defina sua região para receber notificações.');
      return;
    }

    await AsyncStorage.setItem('regiao', regiao);

    const response = await fetch(`${API_URL}/api/smartToken`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fcm: token, regiao }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message);

    clearTimeout(timeoutId);
  } catch (error) {
    Alert.alert('Erro ao salvar token', 'Falha ao enviar token ao servidor.');
    console.log('Erro ao salvar token:', error);
  }
}

async function saveTokenToServer(token: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const regiao = await defRegiao();
    if (regiao === 'NONE') {
      Alert.alert('Região não definida', 'Defina sua região para receber notificações.');
      return;
    }

    await AsyncStorage.setItem('regiao', regiao);

    const response = await fetch(`${API_URL}/api/smartToken`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fcm: token, regiao }),
      signal: controller.signal,
    });

    console.log("salvo");

    const data = await response.json();
    if (!data.success) throw new Error(data.message);

    clearTimeout(timeoutId);
  } catch (error) {
    Alert.alert('Erro ao salvar token', 'Falha ao enviar token ao servidor.');
    console.log('Erro:', error);
  }
}

const App = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const solicitarPermissao = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permissão negada', 'Notificações não funcionarão corretamente.');
          return;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        await AsyncStorage.setItem('token', token);
        if (!token) {
          const token2 = await messaging().getToken();
          await saveTokenToServer(token2);
          return;
        }
        await saveTokenToServer(token);
      } else {
        Alert.alert('Permissão não concedida', 'Notificações não funcionarão corretamente.');
      }
    };

    const configurarListeners = async () => {
      await notifee.createChannel({
        id: 'default',
        name: 'Canal padrão',
        importance: AndroidImportance.HIGH,
      });

      return messaging().onMessage(async remoteMessage => {
        await notifee.displayNotification({
          title: remoteMessage.notification?.title ?? 'Notificação',
          body: remoteMessage.notification?.body ?? '',
          android: {
            channelId: 'default',
            importance: AndroidImportance.HIGH,
            smallIcon: 'ic_launcher',
          },
        });
      });
    };

    solicitarPermissao();
    configurarListeners();
  }, []);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <RegiaoModalProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{ headerStyle: { backgroundColor: '#050505' }, headerTintColor: '#fff' }}>
          <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false, title: "Home" }} />
          <Stack.Screen name="AbrigosScreen" component={AbrigosScreen} options={{title: "Abrigos"}} />
          <Stack.Screen name="ComLocalScreen" component={ComLocalScreen} options={{title: "Chat local"}} />
          <Stack.Screen name="MapScreen" component={MapScreen} options={{title: "Mapa"}} />
          <Stack.Screen name="InfoScreen" component={InfoScreen} options={{title: "Informações úteis"}} />
          <Stack.Screen name="MissionsScreen" component={MissionsScreen} options={{title: "Missões"}}/>
        </Stack.Navigator>
      </NavigationContainer>
    </RegiaoModalProvider>
  );
};

export default App;