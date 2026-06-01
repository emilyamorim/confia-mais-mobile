import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api'; // Ajuste o caminho se necessário

const TABS = ['Todos', 'Hoje', 'Pendentes', 'Confirmados'];

export default function AgendamentosScreen() {
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Busca os dados da API (ou carrega dados de exemplo se a rota ainda não existir)
  async function fetchAgendamentos() {
    try {
      setLoading(true);
      // Aqui assumimos que você terá uma rota para listar os agendamentos
      const response = await api.get('/api/agendamentos/');
      setAgendamentos(response.data);
    } catch (error) {
      console.warn("Rota /api/agendamentos/ não encontrada. Carregando dados visuais de teste...");
      // Dados de fallback para você ver o visual funcionar imediatamente
      setAgendamentos([
        { id: 1, dia: '25', mes_abreviado: 'MAI', horario: '09:00', cliente_nome: 'Cliente 01', servico_nome: 'Corte de cabelo', preco: '30.00', status: 'CONFIRMADO' },
        { id: 2, dia: '25', mes_abreviado: 'MAI', horario: '09:30', cliente_nome: 'Cliente 02', servico_nome: 'Lavar cabelo', preco: '30.00', status: 'PENDENTE' },
        { id: 3, dia: '26', mes_abreviado: 'MAI', horario: '14:00', cliente_nome: 'Cliente 03', servico_nome: 'Estética Facial', preco: '80.00', status: 'CONFIRMADO' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  // Lógica para filtrar a lista com base na aba selecionada e na busca
  const filteredAgendamentos = agendamentos.filter(item => {
    const matchesSearch = item.cliente_nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.servico_nome.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeTab === 'Pendentes') return item.status === 'PENDENTE';
    if (activeTab === 'Confirmados') return item.status === 'CONFIRMADO';
    if (activeTab === 'Hoje') return item.dia === '25'; // Lógica simplificada de "Hoje"
    
    return true; // 'Todos'
  });

  const renderCard = ({ item }) => {
    const isConfirmado = item.status === 'CONFIRMADO';
    const statusColor = isConfirmado ? '#38B2AC' : (item.status === 'PENDENTE' ? '#DD6B20' : '#3182CE');

    return (
      <View style={[styles.card, { borderLeftColor: statusColor }]}>
        
        {/* LINHA SUPERIOR DO CARD */}
        <View style={styles.cardTop}>
          
          {/* Bloco de Data e Hora */}
          <View style={styles.dateBlock}>
            <Text style={styles.dateDay}>{item.dia}</Text>
            <Text style={styles.dateMonth}>{item.mes_abreviado}.</Text>
            <View style={styles.timePill}>
              <Text style={styles.timeText}>{item.horario}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Dados do Cliente e Serviço */}
          <View style={styles.clientInfo}>
            <View style={styles.clientHeader}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>{item.cliente_nome.charAt(0)}</Text>
              </View>
              <Text style={styles.clientName}>{item.cliente_nome}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>
            
            <Text style={styles.serviceDetails}>
              {item.servico_nome} • R$ {item.preco.replace('.', ',')}
            </Text>
          </View>
        </View>

        {/* LINHA INFERIOR (AÇÕES) - Adaptada para Mobile */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnConcluir}>
            <Ionicons name="checkmark-outline" size={16} color="#001F3F" />
            <Text style={styles.btnConcluirText}>Concluir</Text>
          </TouchableOpacity>
          
          <View style={styles.actionRight}>
            <TouchableOpacity style={styles.btnIconLight}>
              <Ionicons name="create-outline" size={18} color="#3182CE" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnIconDanger}>
              <Ionicons name="close-outline" size={18} color="#E53E3E" />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* HEADER AZUL ESCURO */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Agenda</Text>
            <Text style={styles.headerSubtitle}>Gerencie horários e confirmações</Text>
          </View>
        </View>

        {/* BARRA DE PESQUISA */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar cliente ou serviço..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.newButton}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newButtonText}>Novo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ÁREA BRANCA/CINZA CLARO */}
      <View style={styles.content}>
        
        {/* ABAS DE FILTRO */}
        <View style={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LISTA DE AGENDAMENTOS */}
        {loading ? (
          <ActivityIndicator size="large" color="#001F3F" style={{ marginTop: 50 }} />
        ) : (
          <FlatList 
            data={filteredAgendamentos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#001F3F' },
  
  // Header
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 25, backgroundColor: '#001F3F' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#A0AEC0', fontSize: 13, marginTop: 2 },
  
  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 15, zIndex: 1 },
  searchInput: { flex: 1, backgroundColor: '#FFFFFF', height: 45, borderRadius: 8, paddingLeft: 45, paddingRight: 15, color: '#1A202C', fontSize: 14 },
  newButton: { backgroundColor: '#1A365D', flexDirection: 'row', alignItems: 'center', height: 45, paddingHorizontal: 15, borderRadius: 8, marginLeft: 10 },
  newButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 5 },

  // Content Area
  content: { flex: 1, backgroundColor: '#F4F7FE', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  
  // Tabs
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  tabButtonActive: { backgroundColor: '#001F3F', borderColor: '#001F3F' },
  tabText: { fontSize: 12, color: '#718096', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 },
  emptyText: { textAlign: 'center', color: '#A0AEC0', marginTop: 40 },

  // Card
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 15, borderLeftWidth: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardTop: { flexDirection: 'row', marginBottom: 15 },
  dateBlock: { alignItems: 'center', justifyContent: 'center', width: 60 },
  dateDay: { fontSize: 22, fontWeight: 'bold', color: '#1A202C' },
  dateMonth: { fontSize: 12, fontWeight: 'bold', color: '#718096', marginBottom: 5 },
  timePill: { backgroundColor: '#F7FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  timeText: { fontSize: 10, fontWeight: 'bold', color: '#1A202C' },
  divider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
  
  // Client Info
  clientInfo: { flex: 1, justifyContent: 'center' },
  clientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatarMini: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarMiniText: { color: '#3182CE', fontWeight: 'bold', fontSize: 12 },
  clientName: { fontSize: 15, fontWeight: 'bold', color: '#1A202C', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  serviceDetails: { fontSize: 13, color: '#718096' },

  // Actions
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 12 },
  btnConcluir: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E0' },
  btnConcluirText: { marginLeft: 5, fontWeight: 'bold', color: '#001F3F', fontSize: 13 },
  actionRight: { flexDirection: 'row' },
  btnIconLight: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  btnIconDanger: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});