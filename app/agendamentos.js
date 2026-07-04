import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, TextInput, ActivityIndicator, Alert, Modal, Linking, Platform, StatusBar 
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAgendamentos from '../src/hooks/useAgendamentos';
import useIoT from '../src/hooks/useIoT';

const TABS = ['Todos', 'Hoje', 'Pendentes', 'Confirmados'];

export default function AgendamentosScreen() {
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalWalkInVisivel, setModalWalkInVisivel] = useState(false);
  const [nomeWalkIn, setNomeWalkIn] = useState('');
  const [valorWalkIn, setValorWalkIn] = useState('');
  const [enviandoWalkIn, setEnviandoWalkIn] = useState(false);

  // --- Hooks de Lógica Isolada (Clean Architecture) ---
  const { agendamentos, loading: loadingAgendamentos, fetchAgendamentos, atualizarStatus, criarWalkIn } = useAgendamentos();
  const { painelAtivoId, painelAtivoNome, carregandoPainelId, cancelandoPainel, fetchPainelStatus, ativarPainel, cancelarPainel } = useIoT();

  useFocusEffect(
    useCallback(() => {
      fetchAgendamentos();
      fetchPainelStatus();
    }, [fetchAgendamentos, fetchPainelStatus])
  );

  // --- AUTO-REFRESH QUANDO O IOT FINALIZAR ---
  const lastPainelId = useRef(null);
  useEffect(() => {
    // Se havia um painel ativo antes, e agora ele ficou null (foi concluído ou cancelado via IoT)
    if (lastPainelId.current && !painelAtivoId) {
      fetchAgendamentos();
    }
    lastPainelId.current = painelAtivoId;
  }, [painelAtivoId, fetchAgendamentos]);


  const handleAtualizarStatus = async (id, novoStatus) => {
    const { success, error } = await atualizarStatus(id, novoStatus);
    if (success) {
      Alert.alert('Sucesso', `O agendamento foi marcado como ${novoStatus}.`);
    } else {
      Alert.alert('Erro', error);
    }
  };

  const handleAtivarPainel = async (item) => {
    const nomeCliente = item.cliente_nome || item.servico_nome || 'Cliente';
    const { success, error, message } = await ativarPainel(item.id, nomeCliente);
    if (success) {
      Alert.alert('Painel Liberado!', message || 'O cliente foi enviado para a bancada.');
    } else {
      Alert.alert('Erro', error);
    }
  };

  const handleCancelarPainel = async () => {
    const { success, error } = await cancelarPainel();
    if (success) {
      Alert.alert('Painel liberado', 'A seleção foi cancelada. O teclado físico está bloqueado novamente.');
    } else {
      Alert.alert('Erro', error);
    }
  };

  const handleConfirmarWalkIn = async () => {
    const nome = nomeWalkIn.trim();
    if (nome.length === 0) {
      Alert.alert('Atenção', 'Digite o nome do cliente.');
      return;
    }

    setEnviandoWalkIn(true);
    const valorFloat = valorWalkIn ? parseFloat(valorWalkIn.replace(',', '.')) : null;

    // Envia pro IoT (Isso já cria o AtendimentoAtivo no Backend)
    const { success, error, message } = await ativarPainel(null, nome, valorFloat);
    setEnviandoWalkIn(false);
    
    if (success) {
      Alert.alert('Sucesso', `Painel Liberado para ${nome}!`);
      setModalWalkInVisivel(false);
      setNomeWalkIn('');
      setValorWalkIn('');
    } else {
      Alert.alert('Erro ao enviar pro Painel', error);
    }
  };

  const handleWhatsApp = (telefone, nome) => {
    if (!telefone) {
      Alert.alert('Aviso', 'O telefone do cliente não foi informado.');
      return;
    }
    let numeroLimpo = telefone.replace(/\D/g, '');
    if (!numeroLimpo.startsWith('55') && numeroLimpo.length >= 10) numeroLimpo = `55${numeroLimpo}`;
    const texto = `Olá ${nome}, tudo bem? Aqui é do Confia+. Estou passando para lembrar do nosso horário!`;
    Linking.openURL(`whatsapp://send?phone=${numeroLimpo}&text=${encodeURIComponent(texto)}`);
  };

  const handleNovoAgendamento = () => {
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

    let diaExibicao = item.dia || '--';
    let mesExibicao = item.mes_abreviado || 'Mês';
    let horaExibicao = item.horario || '--:--';

    if (item.data_hora_inicio) {
      const dataObj = new Date(item.data_hora_inicio);
      diaExibicao = String(dataObj.getDate()).padStart(2, '0');
      const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
      mesExibicao = meses[dataObj.getMonth()];
      horaExibicao = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    let nomeExibicao = 'Serviço não informado';
    let precoExibicao = '0,00';
    let duracaoExibicao = 0;

    if (item.servicos && item.servicos.length > 0) {
      nomeExibicao = item.servicos.map(s => s.nome || s.nome_servico).join(', ');
      
      const somaPrecos = item.servicos.reduce((total, s) => total + parseFloat(s.preco || 0), 0);
      precoExibicao = somaPrecos.toFixed(2).replace('.', ',');
      
      duracaoExibicao = item.servicos.reduce((total, s) => total + (s.duracao_minutos || 0), 0);
    } else {
      nomeExibicao = item.servico_nome || 'Serviço não informado';
    }

    if (item.servicos_detalhes && item.servicos_detalhes.length > 0) {
      nomeExibicao = item.servicos_detalhes.map(s => s.nome).join(', ');
      duracaoExibicao = item.servicos_detalhes.reduce((total, s) => total + (s.duracao_minutos || 0), 0);
      
      const precoTotal = item.servicos_detalhes.reduce((total, s) => total + (parseFloat(s.preco) || 0), 0);
      precoExibicao = precoTotal.toFixed(2).replace('.', ',');
    }

    if (precoExibicao === '0,00') {
      const precoRaiz = item.preco || item.valor_total || item.valor || 0;
      precoExibicao = parseFloat(precoRaiz).toFixed(2).replace('.', ',');
    }

    const nomeCliente = item.nome_cliente_formatado || item.cliente_nome || 'Cliente';
    const inicialCliente = nomeCliente.charAt(0).toUpperCase();
    const isPainelAtivo = painelAtivoId === item.id;
    const estaCarregando = carregandoPainelId === item.id;

    return (
      <View style={[
        styles.card, 
        { borderLeftColor: statusColor },
        isPainelAtivo && styles.cardPainelAtivo,
      ]}>
        
        {isPainelAtivo && (
          <View style={styles.painelAtivoFaixa}>
            <Ionicons name="hardware-chip" size={14} color="#FFFFFF" />
            <Text style={styles.painelAtivoFaixaText}>NO PAINEL AGORA</Text>
            <TouchableOpacity 
              onPress={handleCancelarPainel}
              disabled={cancelandoPainel}
              style={styles.painelAtivoCancelar}
            >
              {cancelandoPainel ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.painelAtivoCancelarText}>cancelar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardTop}>
          <View style={styles.dateBlock}>
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
              {nomeExibicao} • R$ {precoExibicao} {duracaoExibicao > 0 ? `• ~${duracaoExibicao} min` : ''}
            </Text>
            
            {item.status === 'CONCLUIDO' && item.financeiro && (
              <View style={styles.financeiroResumo}>
                <View style={styles.financeiroRow}>
                  <Ionicons name="time-outline" size={14} color="#4A5568" />
                  <Text style={styles.financeiroText}>
                    Duração: {item.financeiro.duracao_segundos ? `${item.financeiro.duracao_segundos} seg` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.financeiroRow}>
                  <Ionicons name="cash-outline" size={14} color="#4A5568" />
                  <Text style={styles.financeiroText}>
                    Pago: R$ {(item.financeiro.total_pago || 0).toFixed(2).replace('.', ',')} 
                    {item.financeiro.esta_pago ? ' (Total)' : ' (Parcial)'}
                  </Text>
                </View>
                {item.financeiro.historico && item.financeiro.historico.length > 0 && (
                  <View style={styles.financeiroHistorico}>
                    <Text style={styles.financeiroHistoricoTitle}>Parcelas:</Text>
                    {item.financeiro.historico.map((p, idx) => (
                      <Text key={idx} style={styles.financeiroParcela}>
                        • {p.forma_pagamento}: R$ {(p.valor || 0).toFixed(2).replace('.', ',')}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionRow}>
          {item.status !== 'CONCLUIDO' && (
            <TouchableOpacity 
              style={styles.btnConcluir}
              onPress={() => handleAtualizarStatus(item.id, 'CONCLUIDO')}
            >
              <Ionicons name="checkmark-outline" size={16} color="#003B73" />
              <Text style={styles.btnConcluirText}>Concluir</Text>
            </TouchableOpacity>
          )}

          {item.cliente_telefone && item.status !== 'CONCLUIDO' && item.status !== 'CANCELADO' && (
            <TouchableOpacity 
              style={[styles.btnConcluir, { backgroundColor: '#E6FFFA', borderColor: '#38B2AC', marginLeft: 5, paddingHorizontal: 10 }]}
              onPress={() => handleWhatsApp(item.cliente_telefone, item.cliente_nome)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#319795" />
            </TouchableOpacity>
          )}
          
          <View style={styles.actionRight}>
            {item.status === 'CONFIRMADO' && (
              <TouchableOpacity 
                style={[
                  styles.btnIconLight, 
                  { backgroundColor: isPainelAtivo ? '#9AE6B4' : '#C6F6D5', marginRight: 10 },
                  estaCarregando && styles.btnDesabilitado,
                ]}
                onPress={() => handleAtivarPainel(item)}
                disabled={estaCarregando || isPainelAtivo}
              >
                {estaCarregando ? (
                  <ActivityIndicator size="small" color="#22543D" />
                ) : (
                  <Ionicons 
                    name={isPainelAtivo ? "checkmark-circle" : "hardware-chip-outline"} 
                    size={18} 
                    color="#22543D" 
                  />
                )}
              </TouchableOpacity>
            )}

            {item.status === 'PENDENTE' && (
              <TouchableOpacity 
                style={styles.btnIconLight}
                onPress={() => handleAtualizarStatus(item.id, 'CONFIRMADO')}
              >
                <Ionicons name="thumbs-up-outline" size={18} color="#3182CE" />
              </TouchableOpacity>
            )}

            {item.status !== 'CANCELADO' && (
              <TouchableOpacity 
                style={styles.btnIconDanger}
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
          <TouchableOpacity style={styles.newButton} onPress={handleNovoAgendamento}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newButtonText}>Novo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.painelStatusBar}>
        <View style={styles.painelStatusInfo}>
          <View style={[
            styles.painelStatusDot, 
            { backgroundColor: painelAtivoNome ? '#48BB78' : '#A0AEC0' }
          ]} />
          <Text style={styles.painelStatusText}>
            {painelAtivoNome 
              ? `Painel ocupado: ${painelAtivoNome}` 
              : 'Painel livre'}
          </Text>
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

        {loadingAgendamentos ? (
          <ActivityIndicator size="large" color="#003B73" style={{ marginTop: 50 }} />
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

      <Modal
        visible={modalWalkInVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalWalkInVisivel(false);
          setNomeWalkIn('');
          setValorWalkIn('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cliente sem agendamento</Text>
            <Text style={styles.modalSubtitle}>
              Digite o nome e, opcionalmente, o valor do serviço para liberar o painel.
            </Text>

            <TextInput
              style={[styles.modalInput, { marginBottom: 12 }]}
              placeholder="Nome do cliente"
              placeholderTextColor="#A0AEC0"
              value={nomeWalkIn}
              onChangeText={setNomeWalkIn}
              autoFocus
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Valor total (Opcional) - Ex: 60,00"
              placeholderTextColor="#A0AEC0"
              keyboardType="numeric"
              value={valorWalkIn}
              onChangeText={setValorWalkIn}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtnCancelar}
                onPress={() => {
                  setModalWalkInVisivel(false);
                  setNomeWalkIn('');
                  setValorWalkIn('');
                }}
              >
                <Text style={styles.modalBtnCancelarText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalBtnConfirmar}
                onPress={handleConfirmarWalkIn}
                disabled={enviandoWalkIn}
              >
                {enviandoWalkIn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalBtnConfirmarText}>Liberar painel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#003B73', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 25, backgroundColor: '#003B73' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#A0AEC0', fontSize: 13, marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 15, zIndex: 1 },
  searchInput: { flex: 1, backgroundColor: '#FFFFFF', height: 45, borderRadius: 8, paddingLeft: 45, paddingRight: 15, color: '#1A202C', fontSize: 14 },
  newButton: { backgroundColor: '#003B73', flexDirection: 'row', alignItems: 'center', height: 45, paddingHorizontal: 15, borderRadius: 8, marginLeft: 10 },
  newButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 5 },
  painelStatusBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#003B73', paddingHorizontal: 20, paddingBottom: 14,
  },
  painelStatusInfo: { flexDirection: 'row', alignItems: 'center' },
  painelStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  painelStatusText: { color: '#CBD5E0', fontSize: 12, fontWeight: '600' },
  btnWalkIn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
  },
  btnWalkInText: { color: '#003B73', fontSize: 11, fontWeight: '700', marginLeft: 5 },
  content: { flex: 1, backgroundColor: '#F4F7FE', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  tabButtonActive: { backgroundColor: '#003B73', borderColor: '#003B73' },
  tabText: { fontSize: 12, color: '#718096', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10 },
  emptyText: { textAlign: 'center', color: '#A0AEC0', marginTop: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 15, borderLeftWidth: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardPainelAtivo: { shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  painelAtivoFaixa: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#22543D',
    borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 12,
  },
  painelAtivoFaixaText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginLeft: 6, flex: 1 },
  painelAtivoCancelar: { paddingHorizontal: 8, paddingVertical: 2 },
  painelAtivoCancelarText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', textDecorationLine: 'underline' },
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
  btnConcluirText: { marginLeft: 5, fontWeight: 'bold', color: '#003B73', fontSize: 13 },
  actionRight: { flexDirection: 'row' },
  btnIconLight: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  btnIconDanger: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  btnDesabilitado: {
    opacity: 0.5,
  },
  financeiroResumo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  financeiroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  financeiroText: {
    fontSize: 13,
    color: '#4A5568',
    marginLeft: 6,
    fontFamily: 'Inter-Medium',
  },
  financeiroHistorico: {
    marginTop: 6,
    backgroundColor: '#F7FAFC',
    padding: 8,
    borderRadius: 6,
  },
  financeiroHistoricoTitle: {
    fontSize: 12,
    color: '#718096',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  financeiroParcela: {
    fontSize: 12,
    color: '#4A5568',
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 22, width: '100%' },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#718096', marginBottom: 16, lineHeight: 18 },
  modalInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: '#1A202C', marginBottom: 18,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtnCancelar: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalBtnCancelarText: { color: '#718096', fontWeight: '600', fontSize: 13 },
  modalBtnConfirmar: {
    backgroundColor: '#22543D', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 8, minWidth: 120, alignItems: 'center',
  },
  modalBtnConfirmarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});