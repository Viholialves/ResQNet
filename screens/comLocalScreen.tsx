import { View, StyleSheet, Alert, TouchableOpacity, Text, ScrollView, Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
import { API_KEY, API_URL } from '../var_ambiente';
import { syncAbrigos, getDataUltimaSincronizacao } from '../services/syncAbrigos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';

type ComLocalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ComLocalScreen'>;

interface ComLocalScreenProps {
    navigation: ComLocalScreenNavigationProp;
}


const ComLocalScreen: React.FC<ComLocalScreenProps> = ({ navigation }) => {
    const [isOnline, setIsOnline] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);
    const [nomeUsuario, setNomeUsuario] = React.useState('');
    const [mostrarPerguntaNome, setMostrarPerguntaNome] = React.useState(false);
    const [regiao, setRegiao] = React.useState('NaN');
    const [token, setToken] = React.useState('');
    const [textController, setTextController] = React.useState('');
    const [mensagens, setMensagens] = React.useState<any[]>([]);
    const scrollViewRef = React.useRef<ScrollView>(null);

    // Move fetchMensagens to component scope
    const fetchMensagens = async () => {
        try {
            const response = await fetch(`${API_URL}/chat/${regiao}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            }
            });

            if (!response.ok) throw new Error('Erro ao buscar mensagens');

            const data = await response.json();
            if (data && Array.isArray(data.rows)) {
            setMensagens(data.rows.reverse());
            } else {
            setMensagens([]);
            console.error('Dados recebidos não são um array:', data);
            }
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
        }
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [mensagens]);

    useEffect(() => {
        fetchMensagens(); // busca inicial

        const interval = setInterval(fetchMensagens, 2000); // atualiza a cada 5s
        return () => clearInterval(interval);
    }, [regiao]);


    useEffect(() => {
        const checkNetworkStatus = async () => {
            try {
                setIsLoading(true);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
        
                await fetch(`${API_URL}/health`, {
                method: 'GET',
                signal: controller.signal,
                });
        
                clearTimeout(timeoutId);
                setIsOnline(true);
            } catch (error) {
                console.log('Erro ao verificar o status da rede:', error);
                setIsOnline(false);
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };
    
        checkNetworkStatus();
    }, []);

    useEffect(() => {
        const verificarNomeUsuario = async () => {
            try {
                const nomeSalvo = await AsyncStorage.getItem('nomeUsuario');
                if (nomeSalvo) {
                    setNomeUsuario(nomeSalvo);
                } else {
                    setMostrarPerguntaNome(true);
                }
            } catch (error) {
                console.error('Erro ao verificar nome do usuário:', error);
            }
        };

        verificarNomeUsuario();
    }, []);

    useEffect(() => {
        const fetchRegiao = async () => {
            try {
                const storedRegiao = await AsyncStorage.getItem('regiao');
                if (storedRegiao) {
                    setRegiao(storedRegiao);
                } else {
                    // Se não houver região salva, defina uma região padrão
                    const novaRegiao = 'NaN'; // Substitua por uma lógica para definir a região
                    setRegiao(novaRegiao);
                    await AsyncStorage.setItem('regiao', novaRegiao);
                }
            } catch (error) {
                console.error('Erro ao carregar a região:', error);
            }
        };

        fetchRegiao();
    }, []);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                if (storedToken) {
                    setToken(storedToken);
                }
            } catch (error) {
                console.error('Erro ao carregar o token:', error);
            }
        };

        fetchToken();
    }, []);

    if(isOnline === false) {
        Alert.alert(
            'Erro de Conexão',
            'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
            [{ text: 'OK' }]
        );

        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff', fontSize: 18 }}>Erro de Conexão</Text>
            </View>
        );

    }

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#050505", justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text style={{color: "white"}}>Carregando</Text>
            </View>
        );
    }

    async function sendMessage(mensagem: string) {
        if (!token) {
            Alert.alert('Erro', 'Token não encontrado. Por favor, faça login novamente.');
            return;
        }
        if (!nomeUsuario || nomeUsuario.trim() === '') {
            Alert.alert('Erro', 'Por favor, insira um nome válido antes de enviar mensagens.');
            setMostrarPerguntaNome(true);
            return;
        }
        try {
            const response = await fetch(`${API_URL}/chat/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({
                    fcm: token,
                    nome: nomeUsuario,
                    mensagem: mensagem,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text(); // ← opcional: logar o erro
                console.error('Erro ao enviar mensagem:', response.status, errorBody);
                throw new Error(`Erro ao enviar mensagem: ${response.status}`);
            }

            const data = await response.json(); // ← apenas UMA leitura
            setTextController('');
            fetchMensagens(); // ← atualiza as mensagens após enviar
            console.log('Mensagem Enviada', data.message);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            let errorMsg = 'Não foi possível enviar a mensagem.';
            if (error instanceof Error) {
                errorMsg += ' ' + error.message;
            }
            Alert.alert('Erro', errorMsg);
        }
    }

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
            <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: '#050505' }}
                behavior={Platform.OS === 'android' ? 'padding' : undefined}
                keyboardVerticalOffset={ Platform.OS === 'android' ? 55 : 0 }
            >
                <View style={styles.container}>
                    <Text style={{color: '#ffff', fontSize: 15}}>Região: {regiao}</Text>
                    <ScrollView style={styles.chat} ref={scrollViewRef}>
                        {/* chat */}
                        {mensagens.map((msg, index) => (
                            <View key={index} style={ msg.id_token == token ? styles.mensagemDireita : styles.mensagemEsquerda}>
                                <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{msg.nome}</Text>
                                <Text style={{ color: '#FFF' }}>{msg.mensagem}</Text>
                                <Text style={{ fontSize: 10, color: '#cccccc' }}>
                                    {new Date(msg.data_envio).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                        <View style={{paddingBottom: 120}}></View>
                    </ScrollView>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={{ flex: 1, color: "#FFFF", height: 40, borderColor: 'gray', borderWidth: 1, borderRadius: 5, paddingHorizontal: 10 }}
                            placeholder="Digite sua mensagem..."
                            placeholderTextColor="#999"
                            value={textController}
                            onChangeText={setTextController}
                        />
                        <TouchableOpacity
                            style={styles.sendButton}
                            onPress={ async () => {
                                if (!textController || textController.trim() === '') {
                                    Alert.alert('Erro', 'Por favor, digite uma mensagem.');
                                    return;
                                }
                                sendMessage(textController)
                            }}
                            >
                            <Image source={require('../assets/envio.png')} style={{ width: 20, height: 20 }} />
                        
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
                        <Text style={{ fontSize: 18, marginBottom: 10 }}>Como você quer ser chamado?</Text>
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

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0,
        backgroundColor: '#050505',
        paddingHorizontal: 10,
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

    Buttons: {
        backgroundColor: '#423e3e',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        padding: 10,
        borderRadius: 10,
        width: 150,
        height: 180,
        marginHorizontal: 5,
        marginVertical: 5,
    },
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#050505',
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 60,
    },
    chat: {
        flex: 1,
        backgroundColor: '#050505',
        padding: 10,
    },
    mensagemDireita: {
        backgroundColor: '#509438',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        alignSelf: 'flex-end',
        maxWidth: '80%',
        textAlign: 'right',
    },
    mensagemEsquerda: {
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
        alignSelf: 'flex-start',
        maxWidth: '80%',
        textAlign: 'left',
    },
    sendButton: {
        backgroundColor: '#66BC47',
        borderRadius: 5,
        padding: 10,
        marginLeft: 10,
    },
});


export default ComLocalScreen;