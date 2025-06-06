import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_KEY } from '../var_ambiente';

export type missoes = {
  id: number;
  titulo: string;
  descricao: string;
  pontos: number;
  status: string;

};

type ApiResponse = {
  success: boolean;
  missao: missoes[];
};

const STORAGE_KEY = 'missoes';
const SYNC_DATE_KEY = 'dt_sinc';

export const syncMissoes = async (): Promise<void> => {
  //console.log('Iniciando sincronização de abrigos...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_URL}/api/getAllMissao`, {
          method: 'GET',
          headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          },
          signal: controller.signal,
    });

    //console.log(response);

    if (!response.ok) return;

    const data: ApiResponse = await response.json();
    if (!data.success || !Array.isArray(data.missao)) return;

    const apiMissoes = data.missao;

    // Pega os dados atuais salvos localmente
    const localDataRaw = await AsyncStorage.getItem(STORAGE_KEY);
    const localMissoes: missoes[] = localDataRaw ? JSON.parse(localDataRaw) : [];

    // Cria um mapa local para facilitar a busca por ID
    const localMap = new Map(localMissoes.map((a) => [a.id, a]));

    // Atualiza ou adiciona novos abrigos
    const updatedMissoes: missoes[] = apiMissoes.map((apiMissoes) => {
      localMap.delete(apiMissoes.id); // remove os que ainda existem
      return apiMissoes;
    });

    // Agora `localMap` contém apenas os abrigos que não existem mais na API
    const finalMissoes = [...updatedMissoes];

    // Salva os dados atualizados
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalMissoes));

    // Salva a data da última sincronização
    const dt_sinc = new Date().toISOString();
    await AsyncStorage.setItem(SYNC_DATE_KEY, dt_sinc);
  } catch (error) {
    console.log('Erro ao sincronizar missões:', error);
    // Não faz nada se falhar
  }
};

// Função auxiliar para acessar os dados locais
export const getMissoesLocais = async (): Promise<missoes[]> => {
  const localData = await AsyncStorage.getItem(STORAGE_KEY);
  return localData ? JSON.parse(localData) : [];
};

// Função auxiliar para pegar a data da última sincronização
export const getDataUltimaSincronizacao = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(SYNC_DATE_KEY);
};
