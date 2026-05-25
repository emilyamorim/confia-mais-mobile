import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  
  const [username, setUsername] = useState('Usuário');
  const [userPhoto, setUserPhoto] = useState(null); 
  
  const [metrics, setMetrics] = useState({
    recebidos_hoje: 0, entradas_mes: 0, a_receber: 0,
    clientes_pendentes: 0, balanco_total: 0, despesas: 0
  });
  const [agendamentos, setAgendamentos] = useState([]);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      
      // Carrega o nome localmente primeiro para a tela não ficar vazia
      const storedUser = await AsyncStorage.getItem('username');
      if (storedUser) setUsername(storedUser);

      // Busca os dados oficiais do Django
      const response = await api.get('/api/dashboard/');
      
      if (response.data.perfil) {
        setUsername(response.data.perfil.nome);
        setUserPhoto(response.data.perfil.foto);
      }
      
      setMetrics(response.data.metrics);
      setAgendamentos(response.data.ultimos_agendamentos);
    } catch (error) {
      console.error("Erro ao carregar Dashboard:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function handleLogout() {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    router.replace('/');
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Carregando informações...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            {userPhoto ? (
              <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color="#001F3F" />
            )}
          </View>
          <View>
            <Text style={styles.greeting}>Olá, {username}</Text>
            <Text style={styles.subtitle}>Bem-vindo ao Confia+</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* GRID DE CARDS FINANCEIROS */}
        <View style={styles.gridContainer}>
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#E6FFFA' }]}>
              <Ionicons name="arrow-up" size={18} color="#38B2AC" />
            </View>
            <Text style={styles.cardTitle}>Recebidos Hoje</Text>
            <Text style={[styles.cardValue, { color: '#38B2AC' }]}>
              R$ {metrics.recebidos_hoje.toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#EBF8FF' }]}>
              <Ionicons name="calendar-outline" size={18} color="#3182CE" />
            </View>
            <Text style={styles.cardTitle}>Entradas Mês</Text>
            <Text style={[styles.cardValue, { color: '#3182CE' }]}>
              R$ {metrics.entradas_mes.toFixed(2).replace('.', ',')}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#FFFAF0' }]}>
              <Ionicons name="document-text-outline" size={18} color="#DD6B20" />
            </View>
            <Text style={styles.cardTitle}>A Receber</Text>
            <Text style={[styles.cardValue, { color: '#DD6B20' }]}>
              R$ {metrics.a_receber.toFixed(2).replace('.', ',')}
            </Text>
            <Text style={styles.cardSubtitle}>{metrics.clientes_pendentes} clientes</Text>
          </View>

          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FFF4' }]}>
              <Ionicons name="bar-chart-outline" size={18} color="#718096" />
            </View>
            <Text style={styles.cardTitle}>Balanço</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceText}>Total</Text>
              <Text style={styles.balanceTotal}>R$ {metrics.balanco_total.toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceText}>Despesas</Text>
              <Text style={styles.balanceExpense}>- R$ {metrics.despesas.toFixed(2).replace('.', ',')}</Text>
            </View>
          </View>
        </View>

        {/* BOTÕES DE AÇÃO RÁPIDA */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="calculator" size={24} color="#38B2AC" />
            <Text style={styles.actionText}>Calculadora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart" size={24} color="#D69E2E" />
            <Text style={styles.actionText}>Fidelidade</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document" size={24} color="#3182CE" />
            <Text style={styles.actionText}>Anotações</Text>
          </TouchableOpacity>
        </View>

        {/* SESSÃO: ÚLTIMOS AGENDAMENTOS */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Últimos Agendamentos</Text>
          <TouchableOpacity onPress={() => router.push('/agendamentos')}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {agendamentos.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum agendamento encontrado para hoje.</Text>
        ) : (
          agendamentos.map((item) => (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.dateBox}>
                <Text style={styles.dateDay}>{item.dia}</Text>
                <Text style={styles.dateMonth}>{item.mes_abreviado}</Text>
              </View>
              <View style={styles.listContent}>
                <Text style={styles.clientName}>{item.cliente_nome}</Text>
                <Text style={styles.serviceText}>{item.servico_nome} • {item.horario}</Text>
              </View>
              <View style={styles.listRight}>
                <Text style={styles.priceText}>R$ {item.preco}</Text>
                <View style={[
                  styles.statusPill, 
                  { backgroundColor: item.status === 'CONFIRMADO' ? '#38B2AC' : (item.status === 'PENDENTE' ? '#DD6B20' : '#3182CE') }
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#001F3F' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', marginTop: 15, fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  greeting: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#A0AEC0', fontSize: 12 },
  logoutBtn: { padding: 8 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  card: { backgroundColor: '#FFFFFF', width: cardWidth, borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 13, color: '#718096', fontWeight: '600', marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 11, color: '#A0AEC0', marginTop: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  balanceText: { fontSize: 12, color: '#718096' },
  balanceTotal: { fontSize: 12, fontWeight: 'bold', color: '#38B2AC' },
  balanceExpense: { fontSize: 12, fontWeight: 'bold', color: '#E53E3E' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 },
  actionButton: { backgroundColor: '#FFFFFF', flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: 12, marginHorizontal: 5 },
  actionText: { marginTop: 8, fontSize: 12, fontWeight: 'bold', color: '#001F3F' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  seeAllText: { color: '#90CDF4', fontSize: 14, fontWeight: '600' },
  listItem: { backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', padding: 15, marginBottom: 12, alignItems: 'center' },
  dateBox: { alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  dateDay: { fontSize: 18, fontWeight: 'bold', color: '#001F3F' },
  dateMonth: { fontSize: 12, color: '#718096', fontWeight: 'bold' },
  listContent: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  serviceText: { fontSize: 13, color: '#718096' },
  listRight: { alignItems: 'flex-end' },
  priceText: { fontSize: 14, fontWeight: 'bold', color: '#1A202C', marginBottom: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  emptyText: { color: '#A0AEC0', textAlign: 'center', marginVertical: 20, fontStyle: 'italic' }
});