import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, TextInput, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api'; 

const TABS = ['Todos', 'Hoje', 'Pendentes', 'Confirmados'];

export default function AgendamentosScreen() {
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Busca os dados da API
  async function fetchAgendamentos() {
    try {
      setLoading(true);
      const response = await api.get('/api/agendamentos/');
      setAgendamentos(response.data);
    } catch (error) {
      console.warn("Rota /api/agendamentos/ não encontrada. Carregando dados visuais de teste...");
      setAgendamentos([
        { id: 1, dia: '25', mes_abreviado: 'MAI', horario: '09:00', cliente_nome: 'Cliente 01', servico_nome: 'Corte de cabelo', preco: '30.00', status: 'CONFIRMADO' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  // --- SOLUÇÃO 3: FUNÇÃO PARA ATUALIZAR STATUS VIA API ---
  const handleAtualizarStatus = async (id, novoStatus) => {
    try {
      // Faz o PATCH na API para mudar apenas o status
      await api.patch(`/api/agendamentos/${id}/`, { status: novoStatus });
      Alert.alert('Sucesso', `O agendamento foi marcado como ${novoStatus}.`);
      fetchAgendamentos(); // Recarrega a lista para mostrar a nova cor/status
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível atualizar o status do agendamento.');
    }
  };

  // --- SOLUÇÃO 4: FUNÇÃO PARA NOVO AGENDAMENTO ---
  const handleNovoAgendamento = () => {
    // Altere '/novo-agendamento' para o nome correto do ficheiro da sua tela de criação
    router.push('/novo-agendamento'); 
  };

  const filteredAgendamentos = agendamentos.filter(item => {
    const nomeCliente = item.cliente_nome || '';
    const nomeServico = item.servico_nome || '';
    
    const matchesSearch = nomeCliente.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          nomeServico.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeTab === 'Pendentes') return item.status === 'PENDENTE';
    if (activeTab === 'Confirmados') return item.status === 'CONFIRMADO';
    
    // Filtro básico de Hoje (pode ser aprimorado futuramente com a data real)
    if (activeTab === 'Hoje') {
      const hoje = new Date().getDate();
      const diaItem = item.data_hora_inicio ? new Date(item.data_hora_inicio).getDate() : parseInt(item.dia);
      return diaItem === hoje;
    }
    
    return true; 
  });

  const renderCard = ({ item }) => {
    const isConfirmado = item.status === 'CONFIRMADO';
    const statusColor = isConfirmado ? '#38B2AC' : (item.status === 'PENDENTE' ? '#DD6B20' : (item.status === 'CONCLUIDO' ? '#48BB78' : '#E53E3E'));

    // --- SOLUÇÃO 1: FORMATADOR AUTOMÁTICO DE DATA DA API ---
    let diaExibicao = item.dia || '--';
    let mesExibicao = item.mes_abreviado || 'Mês';
    let horaExibicao = item.horario || '--:--';

    // Se o Django enviou a data real (data_hora_inicio), nós formatamos!
    if (item.data_hora_inicio) {
      const dataObj = new Date(item.data_hora_inicio);
      diaExibicao = String(dataObj.getDate()).padStart(2, '0');
      
      const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      mesExibicao = meses[dataObj.getMonth()];
      
      horaExibicao = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    // --- SOLUÇÃO 2: BUSCA ROBUSTA DE PREÇO ---
    let nomeExibicao = 'Serviço não informado';
    let precoExibicao = '0,00';

    if (item.servicos && item.servicos.length > 0) {
      nomeExibicao = item.servicos.map(s => s.nome || s.nome_servico).join(', ');
      
      // Se o serializer enviar o preço dentro do serviço
      if (item.servicos[0].preco !== undefined) {
        const somaPrecos = item.servicos.reduce((total, s) => total + parseFloat(s.preco || 0), 0);
        precoExibicao = somaPrecos.toFixed(2).replace('.', ',');
      }
    } else {
      nomeExibicao = item.servico_nome || 'Serviço não informado';
    }

    // Fallback global de preço caso a API envie o valor no nível raiz do agendamento
    if (precoExibicao === '0,00') {
      const precoRaiz = item.preco || item.valor_total || item.valor || 0;
      precoExibicao = parseFloat(precoRaiz).toFixed(2).replace('.', ',');
    }

    const nomeCliente = item.cliente_nome || 'Cliente';
    const inicialCliente = nomeCliente.charAt(0).toUpperCase();

    return (
      <View style={[styles.card, { borderLeftColor: statusColor }]}>
        
        <View style={styles.cardTop}>
          <View style={styles.dateBlock}>
            {/* Agora utiliza as variáveis de data calculadas */}
            <Text style={styles.dateDay}>{diaExibicao}</Text>
            <Text style={styles.dateMonth}>{mesExibicao}.</Text>
            <View style={styles.timePill}>
              <Text style={styles.timeText}>{horaExibicao}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.clientInfo}>
            <View style={styles.clientHeader}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>{inicialCliente}</Text>
              </View>
              <Text style={styles.clientName}>{nomeCliente}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>
            
            <Text style={styles.serviceDetails}>
              {nomeExibicao} • R$ {precoExibicao}
            </Text>
          </View>
        </View>

        {/* --- BOTÕES DE AÇÃO COM AS FUNÇÕES ATIVADAS --- */}
        <View style={styles.actionRow}>
          {item.status !== 'CONCLUIDO' && (
            <TouchableOpacity 
              style={styles.btnConcluir}
              onPress={() => handleAtualizarStatus(item.id, 'CONCLUIDO')}
            >
              <Ionicons name="checkmark-outline" size={16} color="#001F3F" />
              <Text style={styles.btnConcluirText}>Concluir</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.actionRight}>
            {item.status === 'PENDENTE' && (
              <TouchableOpacity 
                style={styles.btnIconLight} // Botão para Confirmar
                onPress={() => handleAtualizarStatus(item.id, 'CONFIRMADO')}
              >
                <Ionicons name="thumbs-up-outline" size={18} color="#3182CE" />
              </TouchableOpacity>
            )}

            {item.status !== 'CANCELADO' && (
              <TouchableOpacity 
                style={styles.btnIconDanger} // Botão para Cancelar
                onPress={() => handleAtualizarStatus(item.id, 'CANCELADO')}
              >
                <Ionicons name="close-outline" size={18} color="#E53E3E" />
              </TouchableOpacity>
            )}
          </View>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar cliente ou serviço..."
            placeholderTextColor="#A0AEC0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {/* Botão Novo agora chama a navegação */}
          <TouchableOpacity style={styles.newButton} onPress={handleNovoAgendamento}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newButtonText}>Novo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
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
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 25, backgroundColor: '#001F3F' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#A0AEC0', fontSize: 13, marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 15, zIndex: 1 },
  searchInput: { flex: 1, backgroundColor: '#FFFFFF', height: 45, borderRadius: 8, paddingLeft: 45, paddingRight: 15, color: '#1A202C', fontSize: 14 },
  newButton: { backgroundColor: '#1A365D', flexDirection: 'row', alignItems: 'center', height: 45, paddingHorizontal: 15, borderRadius: 8, marginLeft: 10 },
  newButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 5 },
  content: { flex: 1, backgroundColor: '#F4F7FE', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  tabButtonActive: { backgroundColor: '#001F3F', borderColor: '#001F3F' },
  tabText: { fontSize: 12, color: '#718096', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 },
  emptyText: { textAlign: 'center', color: '#A0AEC0', marginTop: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 15, borderLeftWidth: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardTop: { flexDirection: 'row', marginBottom: 15 },
  dateBlock: { alignItems: 'center', justifyContent: 'center', width: 60 },
  dateDay: { fontSize: 22, fontWeight: 'bold', color: '#1A202C' },
  dateMonth: { fontSize: 12, fontWeight: 'bold', color: '#718096', marginBottom: 5 },
  timePill: { backgroundColor: '#F7FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  timeText: { fontSize: 10, fontWeight: 'bold', color: '#1A202C' },
  divider: { width: 1, backgroundColor: '#E2E8F0', marginHorizontal: 15 },
  clientInfo: { flex: 1, justifyContent: 'center' },
  clientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatarMini: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarMiniText: { color: '#3182CE', fontWeight: 'bold', fontSize: 12 },
  clientName: { fontSize: 15, fontWeight: 'bold', color: '#1A202C', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  serviceDetails: { fontSize: 13, color: '#718096' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 12 },
  btnConcluir: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E0' },
  btnConcluirText: { marginLeft: 5, fontWeight: 'bold', color: '#001F3F', fontSize: 13 },
  actionRight: { flexDirection: 'row' },
  btnIconLight: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  btnIconDanger: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});