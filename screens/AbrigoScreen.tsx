import { View, StyleSheet, Alert, TouchableOpacity, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Abrigo } from '../services/syncAbrigos';

type AbrigosScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AbrigosScreen'>;

interface AbrigosScreenProps {
  navigation: AbrigosScreenNavigationProp;
}


const AbrigosScreen: React.FC<AbrigosScreenProps> = ({ navigation }) => {
    const [abrigo, setAbrigo] = React.useState<Abrigo[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    useEffect(() => {
        const fetchAbrigos = async () => {
            try {
                const data = await AsyncStorage.getItem('abrigos');
                if (data) {
                    const abrigos: Abrigo[] = JSON.parse(data);
                    setAbrigo(abrigos);
                }
            } catch (error) {
                console.error('Erro ao carregar abrigos:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAbrigos();
    }, []);



    if (isLoading) {
        return (
          <View style={{ flex: 1, backgroundColor: "#050505", justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
            <Text style={{color: "white"}}>Carregando</Text>
          </View>
        );
    }

    if (!abrigo || abrigo.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#fff', fontSize: 18 }}>Nenhum abrigo encontrado.</Text>
            </View>
        );
    }




    return (
        <View style={styles.container}>
            <ScrollView style={{ marginBottom: 20 }}>
                {abrigo.map((item: Abrigo) => (
                    <View
                        key={item.id}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#423e3e',
                            borderRadius: 10,
                            marginVertical: 6,
                            marginHorizontal: 12,
                            padding: 14,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{item.nome}</Text>
                            <Text style={{ color: '#ccc', fontSize: 14 }}>{item.endereco}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('MapScreen')}
                            style={{
                                padding: 8,
                            }}
                        >
                            <Image
                                source={require('../assets/rotas.png')}
                                style={{ width: 28, height: 28, tintColor: '#fff' }}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
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
  }
});

export default AbrigosScreen;
