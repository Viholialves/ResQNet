import { View, StyleSheet, Alert, TouchableOpacity, Text, ScrollView, ActivityIndicator, Modal, Button, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { API_URL, API_KEY } from '../var_ambiente';
import { syncMissoes, getDataUltimaSincronizacao, missoes } from '../services/syncMissoes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type MissionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MissionsScreen'>;

interface MissionsScreenProps {
  navigation: MissionsScreenNavigationProp;
}

const MissionsScreen: React.FC<MissionsScreenProps> = ({ navigation }) => {
  const [missoes, setMissoes] = useState<missoes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = React.useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [missaoSelecionada, setMissaoSelecionada] = useState<missoes | null>(null);
  const [mostrarPerguntaNome, setMostrarPerguntaNome] = React.useState(false);

  const fetchMissoes = async () => {
    setIsLoading(true);
    try {
      const data = await AsyncStorage.getItem('missoes');
      const nome = await AsyncStorage.getItem('nomeUsuario');
      if(!nome || nome == ""){
        setMostrarPerguntaNome(true);
      }
      if (data) {
        const missoes: missoes[] = JSON.parse(data);
        setMissoes(missoes);
      }
    } catch (error) {
      console.error('Erro ao carregar missoes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    

    fetchMissoes();
  }, []);

  const abrirModal = (missao: missoes) => {
    setMissaoSelecionada(missao);
    setModalVisible(true);
  };

  const concluirMissao = async () => {
    if (missaoSelecionada) {
      const nome = await AsyncStorage.getItem('nomeUsuario');
      const token = await AsyncStorage.getItem('token');
      if(!nome){
        setModalVisible(false);
        setMostrarPerguntaNome(true);
        return
      }

      try {
        await fetch(`${API_URL}/api/setMissionDone`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            id: missaoSelecionada.id,
            nome: nome,
            fcm: token
          })
        });
        Alert.alert("Missão concluída!", `Missão "${missaoSelecionada.titulo}" foi concluída.`);

        syncMissoes();

        fetchMissoes();
      } catch (error) {
        Alert.alert("Erro ao resgatar missão")
      }
      // aqui você pode adicionar lógica para atualizar status, sincronizar, etc.
      setModalVisible(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#050505", justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ color: "white" }}>Carregando</Text>
      </View>
    );
  }

  if (!missoes || missoes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Nenhuma missão encontrada.</Text>
      </View>
    );
  }

  const truncarDescricao = (descricao: string) => {
    return descricao.length > 80 ? descricao.substring(0, 77) + '...' : descricao;
  };

  const salvarNome = async () => {
        if (nomeUsuario.trim() === '') {
            Alert.alert('Erro', 'Por favor, insira um nome válido.');
            return;
        }

        try {
            await AsyncStorage.setItem('nomeUsuario', nomeUsuario);
            setMostrarPerguntaNome(false);
        } catch (error) {
            console.error('Erro ao salvar nome do usuário:', error);
            Alert.alert('Erro', 'Não foi possível salvar seu nome.');
        }
    };

  return (
    <>
      <View style={styles.container}>
        <ScrollView>
            {missoes
            .filter((item: missoes) => item.status !== 'resgatado')
            .map((item: missoes) => (
              <TouchableOpacity
              key={item.id}
              onPress={() => abrirModal(item)}
              style={styles.missaoBox}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{item.titulo}</Text>
                <Text style={{ color: '#ccc', fontSize: 14 }}>{truncarDescricao(item.descricao)}</Text>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{item.status}</Text>
              </View>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{missaoSelecionada?.titulo}</Text>
            <Text style={styles.modalDescription}>{missaoSelecionada?.descricao}</Text>
            <View style={styles.botoes}>
              <Button title="Concluir Missão" onPress={concluirMissao} />
              <Button title="Fechar" onPress={() => setModalVisible(false)} />

            </View>
          </View>
        </View>
      </Modal>
      {mostrarPerguntaNome && (
                      <View style={{
                          position: 'absolute',
                          zIndex: 999,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          justifyContent: 'center',
                          alignItems: 'center',
                          width: '100%',
                          height: '100%',
                          padding: 20,
                      }}>
                          <View style={{
                              backgroundColor: '#fff',
                              padding: 20,
                              borderRadius: 10,
                              width: '100%',
                          }}>
                              <Text style={{ fontSize: 18, marginBottom: 10 }}>Antes defina um nome de usuario</Text>
                              <TextInput
                                  placeholder="Digite seu nome"
                                  style={{
                                      borderWidth: 1,
                                      borderColor: '#ccc',
                                      padding: 10,
                                      borderRadius: 5,
                                      marginBottom: 10,
                                  }}
                                  value={nomeUsuario}
                                  onChangeText={setNomeUsuario}
                              />
                              <TouchableOpacity
                                  style={{
                                      backgroundColor: '#66BC47',
                                      padding: 10,
                                      borderRadius: 5,
                                      alignItems: 'center',
                                  }}
                                  onPress={salvarNome}
                              >
                                  <Text style={{ color: '#fff' }}>Salvar</Text>
                              </TouchableOpacity>
                          </View>
                      </View>
                  )}
    </>
  );
};

const styles = StyleSheet.create({
  botoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,

  },
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: '#050505',
  },
  missaoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#423e3e',
    borderRadius: 10,
    marginVertical: 6,
    marginHorizontal: 12,
    padding: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 20,
  }
});

export default MissionsScreen;
