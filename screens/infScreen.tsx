import { View, StyleSheet,Modal, Alert, TouchableOpacity, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
import { API_URL } from '../var_ambiente';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList} from '../App';
import Video from 'react-native-video';

type InfoScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InfoScreen'>;

interface InfoScreenProps {
  navigation: InfoScreenNavigationProp;
}

const topicos = [
  {
    id: 1,
    titulo: '🆘 Primeiros Socorros Básicos',
    video: require('../assets/videos/primeiros_socorros.mp4'),
    descricao: '\n\n  • Em caso de emergência, verifique se a pessoa está consciente e respirando.\n\n  • Se não estiver respirando, inicie compressões torácicas imediatamente.\n\n  • Chame ajuda (192 - SAMU) o quanto antes e mantenha a calma até a chegada do socorro.\n\n  • Nunca mova vítimas com suspeita de fraturas ou traumas na cabeça/coluna.',
  },
  {
    id: 2,
    titulo: '🌊 Como agir em casos de alagamento',
    video: require('../assets/videos/alagamento.mp4'),
    descricao: '\n\n  • Se houver risco de alagamento, desligue a energia elétrica da casa e suba para andares mais altos ou locais elevados.\n\n  • Evite contato com a água, pois pode estar contaminada ou esconder perigos.\n\n  • Nunca tente atravessar ruas alagadas, especialmente com correnteza.\n\n  • Mantenha documentos e itens essenciais em sacos plásticos.',
  },
  {
    id: 3,
    titulo: '🔥 Evacuação em incêndios',
    video: require('../assets/videos/incendio.mp4'),
    descricao: '\n\n  • Ao perceber fumaça ou fogo, não use elevadores.\n\n  • Mantenha-se abaixado para evitar inalar fumaça tóxica.\n\n  • Cubra nariz e boca com um pano úmido.\n\n  • Siga a rota de fuga mais próxima e deixe o local imediatamente.\n\n  • Nunca tente voltar para buscar objetos. Ligue 193 (Bombeiros) após sair com segurança.',
  },
  {
    id: 4,
    titulo: '🏔️ Deslizamentos: sinais de risco e fuga',
    video: require('../assets/videos/deslizamento.mp4'),
    descricao: '\n\n  • Fique atento a rachaduras no solo ou paredes, inclinação de postes e árvores, e sons de estalos.\n\n  • Estes são sinais de deslizamento iminente.\n\n  • Ao identificar riscos, evacue a área imediatamente para um ponto seguro em local elevado.\n\n  • Avise vizinhos e acione a Defesa Civil pelo número 199.',
  },
  {
    id: 5,
    titulo: '🧴 Kit básico de emergência familiar',
    video: require('../assets/videos/kit_emergencia.mp4'),
    descricao: '\n\n  • Monte um kit com água potável (para pelo menos 3 dias), alimentos não perecíveis, lanterna, pilhas, rádio a baterias, medicamentos de uso contínuo, cópias de documentos importantes, itens de higiene pessoal e apito.\n\n  • Guarde tudo em local acessível e mantenha-o sempre pronto.',
  },
  {
    id: 6,
    titulo: '📝 Checklist: o que ter em uma mochila de evacuação',
    video: require('../assets/videos/checklist.mp4'),
    descricao: '\n\n  • Prepare uma mochila com itens essenciais para sair de casa rapidamente em emergências:\n• roupas leves e resistentes\n• alimentos de fácil preparo\n• garrafa de água\n• kit de primeiros socorros\n• documentos pessoais\n• dinheiro em espécie\n• lanterna\n• carregador portátil\n• itens de higiene.\n\n  • Deixe-a pronta e em local de fácil acesso.',
  },
  {
    id: 7,
    titulo: '📞 Contatos de emergência locais (pré-carregados por cidade)',
    descricao: '\n\n  • Mantenha sempre à mão uma lista com os principais contatos de emergência da sua cidade:\n• Bombeiros (193)\n• SAMU (192)\n• Polícia Militar (190)\n• Defesa Civil (199)\n• hospitais\n• unidades de saúde\n• contatos de vizinhos ou familiares\n\n  • Salve os números no celular e tenha uma cópia impressa.',
  },
];




const InfoScreen: React.FC<InfoScreenProps> = ({ navigation }) => {
    const [isOnline, setIsOnline] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [itemSelecionado, setItemSelecionado] = React.useState<typeof topicos[0] | null>(null);


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

    if (isLoading) {
        return (
        <View style={{ flex: 1, backgroundColor: "#050505", justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
            <Text style={{color: "white"}}>Carregando</Text>
        </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.ButtonsContainer}>
                {topicos.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.Buttons}
                    onPress={() => {
                        console.log('Clicou em:', item.titulo);
                        setItemSelecionado(item);
                        setModalVisible(true);
                    }}
                >
                    <Text style={{ color: 'white', textAlign: 'center' }} numberOfLines={3} ellipsizeMode="tail">
                        {item.titulo}
                    </Text>
                </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal
            visible={modalVisible && itemSelecionado !== null}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
            >               
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    {itemSelecionado && (
                        <ScrollView contentContainerStyle={{ padding: 10 }}>
                            {itemSelecionado.video ? (
                                <View style={{ height: 200, backgroundColor: '#333', justifyContent: 'center' }}>
                                    <Video
                                    source={itemSelecionado.video}
                                    style={{ width: '100%', height: 200 }}
                                    resizeMode="cover"
                                    controls
                                    paused={false} // Adicione esta linha
                                    onError={(error) => console.log('Video error:', error)} // Adicione para debug
                                    />
                                </View>
                            ) : null}
                                
                            <Text style={{ color: 'white', fontSize: 18, marginTop: 20 }}>{itemSelecionado.descricao}</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={{ marginTop: 30, backgroundColor: '#555', padding: 15, borderRadius: 10 }}>
                                <Text style={{ color: 'white', textAlign: 'center' }}>Fechar</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: '#050505',
  },
  ButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 100,
  },
  Buttons: {
    backgroundColor: '#2c2c2c',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    height: 100,
    marginVertical: 10,
  },
});


export default InfoScreen;
