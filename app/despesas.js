import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert 
, Platform, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function DespesasScreen() {
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  async function fetchDespesas() {
    try {
      setLoading(true);
      const res = await api.get('/api/despesas/');
      setDespesas(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDespesas();
  }, []);

  const handleMudarMes = (direcao) => {
    let novoMes = mesSelecionado + direcao;
    let novoAno = anoSelecionado;
    if (novoMes < 0) {
      novoMes = 11;
      novoAno -= 1;
    } else if (novoMes > 11) {
      novoMes = 0;
      novoAno += 1;
    }
    setMesSelecionado(novoMes);
    setAnoSelecionado(novoAno);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Excluir Despesa",
      "Tem certeza que deseja apagar esta despesa? Isso não pode ser desfeito.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/despesas/${id}/`);
              setDespesas(despesas.filter(d => d.id !== id));
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a despesa.');
            }
          }
        }
      ]
    );
  };

  const handleTogglePago = async (item) => {
    try {
      const novoStatus = !item.pago;
      await api.patch(`/api/despesas/${item.id}/`, { pago: novoStatus });
      setDespesas(despesas.map(d => d.id === item.id ? { ...d, pago: novoStatus } : d));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status de pagamento.');
    }
  };

  // Filtragem segura evitando fuso horário
  const despesasFiltradas = despesas.filter(item => {
    if (!item.data) return false;
    const parts = item.data.split('-'); // YYYY-MM-DD
    if (parts.length !== 3) return false;
    const ano = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10) - 1; // 0 a 11
    return ano === anoSelecionado && mes === mesSelecionado;
  });

  const renderDespesa = ({ item }) => {
    const parts = item.data.split('-');
    const dataFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.descricao}>{item.descricao}</Text>
            <Text style={styles.valor}>R$ {parseFloat(item.valor).toFixed(2).replace('.', ',')}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#E53E3E" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.data}>{dataFormatada}</Text>
          <View style={[styles.badge, item.categoria === 'Fixo' ? styles.badgeFixo : styles.badgeVariavel]}>
            <Text style={styles.badgeText}>{item.categoria}</Text>
          </View>
        </View>
        <View style={styles.statusFooter}>
          <TouchableOpacity 
            style={[styles.statusButton, item.pago ? styles.statusPago : styles.statusPendente]}
            onPress={() => handleTogglePago(item)}
          >
            <Ionicons name={item.pago ? "checkmark-circle" : "time-outline"} size={16} color="#FFF" style={{ marginRight: 5 }} />
            <Text style={styles.statusButtonText}>{item.pago ? "Paga" : "Pendente"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Despesas</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Navegador de Mês */}
      <View style={styles.monthNavigator}>
        <TouchableOpacity onPress={() => handleMudarMes(-1)} style={styles.monthButton}>
          <Ionicons name="chevron-back" size={24} color="#003B73" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{MESES[mesSelecionado]} de {anoSelecionado}</Text>
        <TouchableOpacity onPress={() => handleMudarMes(1)} style={styles.monthButton}>
          <Ionicons name="chevron-forward" size={24} color="#003B73" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#003B73" style={{ marginTop: 50 }} />
        ) : (
          <FlatList 
            data={despesasFiltradas}
            keyExtractor={item => item.id.toString()}
            renderItem={renderDespesa}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma despesa para este mês.</Text>}
            onRefresh={fetchDespesas}
            refreshing={loading}
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/nova-despesa')}
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
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  monthButton: { padding: 5 },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#003B73' },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'flex-start' },
  descricao: { fontSize: 16, fontWeight: '600', color: '#2D3748' },
  valor: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginTop: 5 },
  deleteButton: { padding: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  data: { fontSize: 14, color: '#718096' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeFixo: { backgroundColor: '#EBF4FF' },
  badgeVariavel: { backgroundColor: '#FEFCBF' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#2D3748' },
  statusFooter: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10, alignItems: 'flex-end' },
  statusButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusPago: { backgroundColor: '#38B2AC' },
  statusPendente: { backgroundColor: '#DD6B20' },
  statusButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
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
