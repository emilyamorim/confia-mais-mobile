import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ActivityIndicator, Alert, ScrollView, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';

export default function NovoAgendamentoScreen() {
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState([]);
  
  // Estados de seleção
  const [selectedServico, setSelectedServico] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHorario, setSelectedHorario] = useState(null);
  
  // Estado para os horários disponíveis vindos da API
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  // 1. Gera os próximos 14 dias para o calendário horizontal
  const getNext14Days = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const diasDisponiveis = getNext14Days();

  // 2. Busca os serviços disponíveis na API ao carregar o ecrã
  useEffect(() => {
    async function fetchServicos() {
      try {
        const response = await api.get('/api/servicos/');
        setServicos(response.data);
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
        Alert.alert('Erro', 'Não foi possível carregar os serviços.');
      }
    }
    fetchServicos();
  }, []);

  // 3. Busca os horários livres sempre que o utilizador escolhe um serviço e um dia
  useEffect(() => {
    async function fetchHorarios() {
      if (!selectedServico || !selectedDate) return;

      setLoadingHorarios(true);
      setSelectedHorario(null); // Limpa o horário anterior

      // Formata a data para YYYY-MM-DD
      const ano = selectedDate.getFullYear();
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const dataFormatada = `${ano}-${mes}-${dia}`;

      try {
        const response = await api.get(`/api/horarios/disponiveis/?data=${dataFormatada}&servico_id=${selectedServico}`);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setHorariosDisponiveis([]);
      } finally {
        setLoadingHorarios(false);
      }
    }

    fetchHorarios();
  }, [selectedServico, selectedDate]);

  // 4. Envia o Agendamento para o Back-end
  const handleConfirmar = async () => {
    if (!selectedServico || !selectedDate || !selectedHorario) {
      Alert.alert('Atenção', 'Por favor, selecione um serviço, uma data e um horário.');
      return;
    }

    setLoading(true);

    const ano = selectedDate.getFullYear();
    const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dia = String(selectedDate.getDate()).padStart(2, '0');
    
    // Monta a string no formato ISO que o Django espera (YYYY-MM-DDTHH:MM:00)
    const dataHoraInicio = `${ano}-${mes}-${dia}T${selectedHorario}:00`;

    try {
      await api.post('/api/agendamentos/', {
        servicos: [selectedServico], // O Django espera uma lista de IDs devido ao ManyToMany
        data_hora_inicio: dataHoraInicio,
        status: 'PENDENTE'
      });

      Alert.alert('Sucesso!', 'Agendamento registado com sucesso.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar agendar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Funções auxiliares para formatação
  const getDiaSemana = (date) => {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return dias[date.getDay()];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Agendamento</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* PASSO 1: ESCOLHER O SERVIÇO */}
        <Text style={styles.sectionTitle}>1. Escolha o Serviço</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {servicos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum serviço disponível.</Text>
          ) : (
            servicos.map((servico) => (
              <TouchableOpacity 
                key={servico.id}
                style={[styles.cardSelect, selectedServico === servico.id && styles.cardSelectActive]}
                onPress={() => setSelectedServico(servico.id)}
              >
                <Text style={[styles.cardSelectTitle, selectedServico === servico.id && styles.textActive]}>
                  {servico.nome}
                </Text>
                <Text style={[styles.cardSelectPrice, selectedServico === servico.id && styles.textActive]}>
                  R$ {String(servico.preco || '0.00').replace('.', ',')}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* PASSO 2: ESCOLHER A DATA */}
        <Text style={styles.sectionTitle}>2. Escolha o Dia</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {diasDisponiveis.map((date, index) => {
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity 
                key={index}
                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDayName, isSelected && styles.textActive]}>
                  {getDiaSemana(date)}
                </Text>
                <Text style={[styles.dateDayNumber, isSelected && styles.textActive]}>
                  {String(date.getDate()).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* PASSO 3: ESCOLHER O HORÁRIO */}
        <Text style={styles.sectionTitle}>3. Escolha o Horário</Text>
        {loadingHorarios ? (
          <ActivityIndicator size="small" color="#3182CE" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.timeGrid}>
            {(!selectedServico || !selectedDate) ? (
              <Text style={styles.emptyText}>Selecione um serviço e um dia primeiro.</Text>
            ) : horariosDisponiveis.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum horário disponível para este dia.</Text>
            ) : (
              horariosDisponiveis.map((hora, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.timeCard, selectedHorario === hora && styles.timeCardActive]}
                  onPress={() => setSelectedHorario(hora)}
                >
                  <Text style={[styles.timeText, selectedHorario === hora && styles.textActive]}>
                    {hora}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* BOTÃO DE CONFIRMAR FIXO NO RODAPÉ */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.btnConfirmar, 
            (!selectedServico || !selectedDate || !selectedHorario || loading) && styles.btnConfirmarDisabled
          ]}
          onPress={handleConfirmar}
          disabled={!selectedServico || !selectedDate || !selectedHorario || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.btnConfirmarText}>Confirmar Agendamento</Text>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#001F3F' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 25 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  
  content: { flex: 1, backgroundColor: '#F4F7FE', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A202C', marginLeft: 20, marginBottom: 15, marginTop: 10 },
  horizontalScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  emptyText: { color: '#A0AEC0', fontSize: 14, fontStyle: 'italic', marginLeft: 20 },
  
  // Cartões de Serviço
  cardSelect: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, marginRight: 15, width: 140, borderWidth: 1, borderColor: '#E2E8F0' },
  cardSelectActive: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  cardSelectTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A202C', marginBottom: 5 },
  cardSelectPrice: { fontSize: 13, color: '#718096' },
  
  // Cartões de Data
  dateCard: { backgroundColor: '#FFFFFF', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 12, marginRight: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  dateCardActive: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  dateDayName: { fontSize: 12, color: '#718096', textTransform: 'uppercase', marginBottom: 5 },
  dateDayNumber: { fontSize: 20, fontWeight: 'bold', color: '#1A202C' },
  
  // Grid de Horários
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10, paddingBottom: 40 },
  timeCard: { backgroundColor: '#FFFFFF', width: '30%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  timeCardActive: { backgroundColor: '#3182CE', borderColor: '#3182CE' },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#1A202C' },
  
  textActive: { color: '#FFFFFF' },

  // Rodapé
  footer: { backgroundColor: '#FFFFFF', padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  btnConfirmar: { backgroundColor: '#3182CE', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnConfirmarDisabled: { backgroundColor: '#A0AEC0' },
  btnConfirmarText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});