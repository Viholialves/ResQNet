import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_KEY } from '../var_ambiente';

export type Abrigo = {
  id: number;
  nome: string;
  descricao: string;
  endereco: string;
  longi: string;
  lati: string;
};

type ApiResponse = {
  success: boolean;
  abrigos: Abrigo[];
};

const STORAGE_KEY = 'abrigos';
const SYNC_DATE_KEY = 'dt_sinc';

export const syncAbrigos = async (): Promise<void> => {
  //console.log('Iniciando sincronização de abrigos...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_URL}/api/getAbrigos`, {
          method: 'GET',
          headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          },
          signal: controller.signal,
    });

    if (!response.ok) return;

    const data: ApiResponse = await response.json();
    if (!data.success || !Array.isArray(data.abrigos)) return;

    const apiAbrigos = data.abrigos;

    // Pega os dados atuais salvos localmente
    const localDataRaw = await AsyncStorage.getItem(STORAGE_KEY);
    const localAbrigos: Abrigo[] = localDataRaw ? JSON.parse(localDataRaw) : [];

    // Cria um mapa local para facilitar a busca por ID
    const localMap = new Map(localAbrigos.map((a) => [a.id, a]));

    // Atualiza ou adiciona novos abrigos
    const updatedAbrigos: Abrigo[] = apiAbrigos.map((apiAbrigo) => {
      localMap.delete(apiAbrigo.id); // remove os que ainda existem
      return apiAbrigo;
    });

    // Agora `localMap` contém apenas os abrigos que não existem mais na API
    const finalAbrigos = [...updatedAbrigos];

    // Salva os dados atualizados
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalAbrigos));

    // Salva a data da última sincronização
    const dt_sinc = new Date().toISOString();
    await AsyncStorage.setItem(SYNC_DATE_KEY, dt_sinc);
  } catch (error) {
    console.log('Erro ao sincronizar abrigos:', error);
    // Não faz nada se falhar
  }
};

// Função auxiliar para acessar os dados locais
export const getAbrigosLocais = async (): Promise<Abrigo[]> => {
  const localData = await AsyncStorage.getItem(STORAGE_KEY);
  return localData ? JSON.parse(localData) : [];
};

// Função auxiliar para pegar a data da última sincronização
export const getDataUltimaSincronizacao = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(SYNC_DATE_KEY);
};
