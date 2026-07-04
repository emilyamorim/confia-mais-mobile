import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Image, Modal, Animated, TouchableWithoutFeedback, AppState, Alert, Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import api from '../services/api';
import useIoT from '../hooks/useIoT';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [appStateVisible, setAppStateVisible] = useState(AppState.currentState);
  const slideAnim = React.useRef(new Animated.Value(-width * 0.75)).current;

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: -width * 0.75,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };
  
  const [username, setUsername] = useState('Usuário');
  const [userPhoto, setUserPhoto] = useState(null); 
  const [userId, setUserId] = useState(null);
  const { painelAtivoId, ativarPainel, cancelarPainel, carregandoPainelId, cancelandoPainel, fetchPainelStatus } = useIoT();
  
  const [metrics, setMetrics] = useState({
    recebidos_hoje: 0, entradas_mes: 0, a_receber: 0,
    clientes_pendentes: 0, balanco_total: 0, despesas: 0
  });
  const [agendamentos, setAgendamentos] = useState([]);
  const [faturamentoSemana, setFaturamentoSemana] = useState([]);

  // --- AUTO-REFRESH QUANDO O IOT FINALIZAR ---
  const lastPainelId = useRef(null);
  useEffect(() => {
    if (lastPainelId.current && !painelAtivoId) {
      fetchDashboardData(true);
    }
    lastPainelId.current = painelAtivoId;
  }, [painelAtivoId]);

  async function fetchDashboardData(silent = false) {
    try {
      if (!silent) setLoading(true);
      
      // Carrega o nome localmente primeiro para a tela não ficar vazia
      const storedUser = await AsyncStorage.getItem('username');
      if (storedUser && !silent) setUsername(storedUser);

      // Busca os dados oficiais do Django
      const response = await api.get('/api/dashboard/');
      
      if (response.data.perfil) {
        setUsername(response.data.perfil.nome);
        setUserPhoto(response.data.perfil.foto);
        setUserId(response.data.perfil.id);
      }
      
      setMetrics(response.data.metrics);
      setAgendamentos(response.data.proximos_agendamentos || []);
      setFaturamentoSemana(response.data.faturamento_semana || []);
      
      // Verifica o IoT
      fetchPainelStatus();
    } catch (error) {
      console.error("Erro ao carregar Dashboard:", error.response?.data || error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData(false);

    let interval;
    if (appStateVisible === 'active') {
      interval = setInterval(() => {
        fetchDashboardData(true);
      }, 5000); // Polling a cada 5 segundos
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppStateVisible(nextAppState);
    });

    return () => {
      if (interval) clearInterval(interval);
      subscription.remove();
    };
  }, [appStateVisible]);

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
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity onPress={toggleMenu} style={{ marginRight: 15 }}>
            <Ionicons name="menu" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerLeft} onPress={() => router.push('/perfil')} activeOpacity={0.7}>
            <View style={styles.avatarCircle}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={20} color="#003B73" />
              )}
            </View>
            <View>
              <Text style={styles.greeting}>Olá, {username}</Text>
              <Text style={styles.subtitle}>Ver meu perfil</Text>
            </View>
          </TouchableOpacity>
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

          <TouchableOpacity style={styles.card} onPress={() => router.push('/fiados')} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: '#FFFAF0' }]}>
              <Ionicons name="document-text-outline" size={18} color="#DD6B20" />
            </View>
            <Text style={styles.cardTitle}>A Receber</Text>
            <Text style={[styles.cardValue, { color: '#DD6B20' }]}>
              R$ {metrics.a_receber.toFixed(2).replace('.', ',')}
            </Text>
            <Text style={styles.cardSubtitle}>{metrics.clientes_pendentes} clientes</Text>
          </TouchableOpacity>

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

        {/* GRÁFICO DE FATURAMENTO SEMANAL */}
        {faturamentoSemana.length > 0 && (
          <View style={{ marginTop: 20, marginBottom: 5, backgroundColor: '#FFF', borderRadius: 16, padding: 15, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>Faturamento (Últimos 7 dias)</Text>
            <LineChart
              data={{
                labels: faturamentoSemana.map(item => item.dia),
                datasets: [{ data: faturamentoSemana.map(item => item.valor) }]
              }}
              width={Dimensions.get('window').width - 70}
              height={220}
              yAxisLabel="R$ "
              chartConfig={{
                backgroundColor: '#FFF',
                backgroundGradientFrom: '#FFF',
                backgroundGradientTo: '#FFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 59, 115, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(113, 128, 150, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "4", strokeWidth: "2", stroke: "#90CDF4" }
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16, alignSelf: 'center' }}
            />
          </View>
        )}

        {/* BOTÕES DE AÇÃO RÁPIDA */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/novo-agendamento')}>
            <Ionicons name="calendar-outline" size={24} color="#38B2AC" />
            <Text style={styles.actionText}>Agendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/nova-despesa')}>
            <Ionicons name="cart" size={24} color="#E53E3E" />
            <Text style={styles.actionText}>Despesa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/clientes')}>
            <Ionicons name="people-outline" size={24} color="#3182CE" />
            <Text style={styles.actionText}>Clientes</Text>
          </TouchableOpacity>
        </View>

        {/* SESSÃO: PRÓXIMOS AGENDAMENTOS */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Próximos Agendamentos</Text>
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
                
                {painelAtivoId === item.id ? (
                  <TouchableOpacity 
                    style={[styles.statusPill, { backgroundColor: '#E53E3E', flexDirection: 'row', alignItems: 'center' }]}
                    onPress={() => cancelarPainel()}
                  >
                    {cancelandoPainel ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="stop-circle" size={14} color="#FFF" style={{marginRight: 4}} />}
                    <Text style={styles.statusText}>Parar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.statusPill, { backgroundColor: '#3182CE', flexDirection: 'row', alignItems: 'center' }]}
                    onPress={async () => {
                       const res = await ativarPainel(item.id, item.cliente_nome, item.preco);
                       if(!res.success) Alert.alert("Erro", res.error);
                    }}
                  >
                    {carregandoPainelId === item.id ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="play-circle" size={14} color="#FFF" style={{marginRight: 4}} />}
                    <Text style={styles.statusText}>Bancada</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MENU LATERAL CUSTOMIZADO */}
      <Modal visible={menuVisible} transparent animationType="none" onRequestClose={toggleMenu}>
        <View style={styles.menuOverlay}>
          <TouchableWithoutFeedback onPress={toggleMenu}>
            <View style={styles.menuOverlayBackground} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.menuHeaderModal}>
                <Text style={styles.menuTitleModal}>Confia+</Text>
                <TouchableOpacity onPress={toggleMenu}>
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.menuScroll}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); }}>
                  <Ionicons name="home" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/agendamentos'); }}>
                  <Ionicons name="calendar" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Agendamentos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/fiados'); }}>
                  <Ionicons name="document-text" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>A Receber (Fiados)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/despesas'); }}>
                  <Ionicons name="cash-outline" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Despesas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/nova-despesa'); }}>
                  <Ionicons name="cart" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Lançar Despesa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/caixa'); }}>
                  <Ionicons name="wallet-outline" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Caixa / Saúde</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={async () => {
                  toggleMenu();
                  if (userId) {
                    // Substitua pelo domínio real de produção
                    const link = `http://localhost:5173/loja/${userId}`;
                    await Clipboard.setStringAsync(link);
                    Alert.alert("Link Copiado! ✅", "O link da sua Vitrine foi copiado e já pode ser colado no Instagram ou WhatsApp.");
                  } else {
                    Alert.alert("Erro", "Ainda estamos carregando seus dados, tente novamente em instantes.");
                  }
                }}>
                  <Ionicons name="share-social-outline" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={[styles.menuItemText, { fontWeight: 'bold' }]}>Copiar Meu Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/horarios'); }}>
                  <Ionicons name="time-outline" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Meus Horários</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/servicos'); }}>
                  <Ionicons name="cut-outline" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Meus Serviços</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/clientes'); }}>
                  <Ionicons name="people-outline" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Meus Clientes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { toggleMenu(); router.push('/perfil'); }}>
                  <Ionicons name="person" size={22} color="#003B73" style={{ marginRight: 15 }} />
                  <Text style={styles.menuItemText}>Meu Perfil</Text>
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity style={styles.menuItemLogout} onPress={() => { toggleMenu(); handleLogout(); }}>
                <Ionicons name="log-out" size={22} color="#E53E3E" style={{ marginRight: 15 }} />
                <Text style={styles.menuItemLogoutText}>Sair do Aplicativo</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#003B73', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', marginTop: 15, fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerLeftContainer: { flexDirection: 'row', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  greeting: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#A0AEC0', fontSize: 12 },
  logoutBtn: { padding: 8 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, backgroundColor: '#F4F7FE' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  card: { backgroundColor: '#FFFFFF', width: cardWidth, minHeight: 135, borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
  iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 13, color: '#718096', fontWeight: '600', marginBottom: 8 },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 11, color: '#A0AEC0', marginTop: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  balanceText: { fontSize: 12, color: '#718096' },
  balanceTotal: { fontSize: 12, fontWeight: 'bold', color: '#38B2AC' },
  balanceExpense: { fontSize: 12, fontWeight: 'bold', color: '#E53E3E' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 },
  actionButton: { backgroundColor: '#FFFFFF', flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: 12, marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionText: { marginTop: 8, fontSize: 12, fontWeight: 'bold', color: '#003B73' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  sectionTitle: { color: '#003B73', fontSize: 18, fontWeight: 'bold' },
  seeAllText: { color: '#003B73', fontSize: 14, fontWeight: '600' },
  listItem: { backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', padding: 15, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  dateBox: { alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  dateDay: { fontSize: 18, fontWeight: 'bold', color: '#003B73' },
  dateMonth: { fontSize: 12, color: '#718096', fontWeight: 'bold' },
  listContent: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: 'bold', color: '#1A202C', marginBottom: 4 },
  serviceText: { fontSize: 13, color: '#718096' },
  listRight: { alignItems: 'flex-end' },
  priceText: { fontSize: 14, fontWeight: 'bold', color: '#1A202C', marginBottom: 6 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  emptyText: { color: '#003B73', textAlign: 'center', marginVertical: 20, fontStyle: 'italic' },
  menuOverlay: { flex: 1, flexDirection: 'row' },
  menuOverlayBackground: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuContainer: { width: width * 0.75, height: '100%', backgroundColor: '#F4F7FE' },
  menuHeaderModal: { backgroundColor: '#003B73', padding: 20, paddingTop: 40, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuTitleModal: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  menuScroll: { flex: 1, paddingTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  menuItemText: { fontSize: 16, color: '#003B73', fontWeight: '600' },
  menuItemLogout: { flexDirection: 'row', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  menuItemLogoutText: { fontSize: 16, color: '#E53E3E', fontWeight: 'bold' }
});