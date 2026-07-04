import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput
, Platform, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';

export default function ServicosScreen() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchServicos() {
    try {
      setLoading(true);
      const res = await api.get('/api/servicos/');
      setServicos(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os serviços.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServicos();
  }, []);

  async function handleDeleteServico(id, nome) {
    Alert.alert(
      "Apagar Serviço",
      `Tem certeza que deseja apagar o serviço "${nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/api/servicos/${id}/`);
              setServicos(servicos.filter(s => s.id !== id));
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Não foi possível apagar o serviço.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  const renderServico = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.preco}>R$ {parseFloat(item.preco).toFixed(2).replace('.', ',')}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => router.push({
              pathname: '/novo-servico',
              params: {
                id: item.id,
                nome: item.nome,
                preco: item.preco,
                duracao_minutos: item.duracao_minutos
              }
            })}
          >
            <Ionicons name="pencil" size={20} color="#3182CE" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => handleDeleteServico(item.id, item.nome)}
          >
            <Ionicons name="trash-outline" size={20} color="#E53E3E" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <Text style={styles.duracao}>Duração: {item.duracao_minutos} min</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Serviços</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#003B73" style={{ marginTop: 50 }} />
        ) : (
          <FlatList 
            data={servicos}
            keyExtractor={item => item.id.toString()}
            renderItem={renderServico}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum serviço cadastrado.</Text>}
            onRefresh={fetchServicos}
            refreshing={loading}
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/novo-servico')}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0  },
  header: {
    backgroundColor: '#003B73',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1 },
  listContainer: { padding: 20 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  nome: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  preco: { fontSize: 15, fontWeight: 'bold', color: '#38B2AC', marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  iconButton: { padding: 5 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-start' },
  duracao: { fontSize: 13, color: '#718096' },
  emptyText: { textAlign: 'center', color: '#718096', marginTop: 20, fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#38B2AC',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});
