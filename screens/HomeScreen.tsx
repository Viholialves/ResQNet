import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Button
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { API_KEY, API_URL } from '../var_ambiente';
import { syncAbrigos, getDataUltimaSincronizacao } from '../services/syncAbrigos';
import { syncMissoes } from '../services/syncMissoes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import Video from 'react-native-video';


import { StackNavigationProp } from '@react-navigation/stack';
import {
  RootStackParamList,
  changeRegiao,
  defRegiao,
  updateTokenToServer,
} from '../App';


type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HomeScreen'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

Sound.setCategory('Playback');


const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSinc, setLastSinc] = useState('N/A');
  const [regiao, setRegiao] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [bgColor, setBgColor] = useState('white');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Sound | null>(null);

  const toggleColor = () => {
    setBgColor(prev => (prev === 'white' ? 'red' : 'white'));
  };

  const startAlarm = () => {

    setModalVisible(true);

    // Inicia o piscar da tela
    intervalRef.current = setInterval(toggleColor, 500);

  };


  const stopAlarm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (soundRef.current) {
      soundRef.current.stop(() => {
        soundRef.current && soundRef.current.release();
        soundRef.current = null;
      });
    }
    setModalVisible(false);
    setBgColor('white');
  };

  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        await fetch(`${API_URL}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (error) {
        console.log('Erro ao verificar a rede:', error);
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkNetworkStatus();
  }, []);

  useEffect(() => {
    const sincronizar = async () => {
      await syncAbrigos();
      await syncMissoes();
      const ultimaData = await getDataUltimaSincronizacao();
      if (ultimaData) {
        setLastSinc(new Date(ultimaData).toLocaleString('pt-BR'));
      }
    };

    if (isOnline) sincronizar();
  }, [isOnline]);

  if (isLoading || !regiao || regiao === 'NaN') {
    if(regiao === null || regiao == undefined){
      defRegiao().then(setRegiao);
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={{ color: '#FFF' }}>Carregando dados iniciais...</Text>
      </View>
    );
  }

  async function sos() {
    startAlarm();
    const regiao = await AsyncStorage.getItem('regiao');

    if(regiao === null || regiao == undefined){
      Alert.alert("regiao invalida");
      return;
    }

    await fetch(`${API_URL}/api/sendNotificationByRegiao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        title: "SOS",
        body: "Alerta - Alerta - Alerta\nUm usuario na sua região esta solicitando socorro imediato.",
        regiao: regiao
      })
    });

  }

  return (
    <>
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.statusBar}>
            <TouchableOpacity
              onPress={async () => {
                const novaRegiao = await changeRegiao();
                await updateTokenToServer(token, novaRegiao);
                setRegiao(novaRegiao);
              }}
            >
              <Text style={[styles.statusText, { color: '#70B49D' }]}>{regiao}</Text>
            </TouchableOpacity>

            <Text style={[styles.statusText, { color: isOnline ? '#70B49D' : '#C72D2C' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.sosContainer}>
            <TouchableOpacity
              onPress={async ()  => sos()}
              style={styles.sosButton}
            >
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.syncContainer}>
            <TouchableOpacity
              onPress={async () => {
                await syncAbrigos();
                await syncMissoes();
                const data = await getDataUltimaSincronizacao();
                setLastSinc(data ? new Date(data).toLocaleString('pt-BR') : 'N/A');
              }}
            >
              <Text style={styles.syncText}>Última sincronização: {lastSinc}</Text>
            </TouchableOpacity>
          </View>


          <View style={styles.ButtonsContainer}>
            <MenuButton
              title="Abrigos Próximos"
              image={require('../assets/abrigo.webp')}
              onPress={() => navigation.navigate('AbrigosScreen')}
            />
            <MenuButton
              title="Rotas Seguras"
              image={require('../assets/rotas.png')}
              onPress={() => navigation.navigate('MapScreen')}
            />
            <MenuButton
              title="Missões Voluntárias"
              image={require('../assets/voluntario.png')}
              onPress={() => navigation.navigate("MissionsScreen")}
            />
            <MenuButton
              title="Comunicação Local"
              image={require('../assets/comunic.png')}
              onPress={() => navigation.navigate('ComLocalScreen')}
            />
            <MenuButton
              title="Informações Úteis"
              image={require('../assets/info.png')}
              onPress={() => navigation.navigate('InfoScreen')}
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={[styles.alertContainer, { backgroundColor: bgColor }]}>
          <Text style={styles.alertText}>🚨 ALERTA DE EMERGÊNCIA 🚨</Text>
          <TouchableOpacity style={styles.closeButton} onPress={stopAlarm}>
            <Text style={styles.buttonText}>Fechar Alerta</Text>
          </TouchableOpacity>
        </View>
        <Video
          source={require("../assets/videos/sirene.mp4")}
          style={{ width: 20, height: 20 }}
          resizeMode="cover"
          controls
          paused={false} // Adicione esta linha
          onError={(error) => console.log('Video error:', error)} // Adicione para debug
        />
      </Modal>
    </>
  );
};

// Componente separado para os botões
const MenuButton = ({
  title,
  image,
  onPress,
  fullWidth = false,
}: {
  title: string;
  image: any;
  onPress: () => void;
  fullWidth?: boolean;
}) => (
  <TouchableOpacity onPress={onPress} style={fullWidth ? styles.ButtonInfo : styles.Buttons}>
    <Image source={image} style={{ width: 50, height: 50 }} />
    <View style={{ padding: 10 }} />
    <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
    alertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#000'
  },
  closeButton: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10
  },
    buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: '#050505',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
  },
  statusText: {
    fontSize: 20,
    marginHorizontal: 30,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  syncContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  syncText: {
    fontSize: 10,
    color: 'white',
  },
  ButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    backgroundColor: '#050505',
  },
  ButtonInfo: {
    backgroundColor: '#423e3e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    width: 340,
    height: 180,
    margin: 5,
  },
  Buttons: {
    backgroundColor: '#423e3e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    width: 150,
    height: 180,
    margin: 5,
  },
});

export default HomeScreen;
