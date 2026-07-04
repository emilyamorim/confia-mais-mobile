import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, TextInput, Switch, KeyboardAvoidingView, Platform
, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';

const DIAS_NOME = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
  'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
];

// Helper para formatar hora (ex: 0800 -> 08:00)
const formatTime = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 4) return digits.slice(0, 4).replace(/(\d{2})(\d{2})/, '$1:$2');
  if (digits.length >= 3) return digits.replace(/(\d{2})(\d+)/, '$1:$2');
  return digits;
};

// Helper para garantir formato HH:MM:SS para a API (ex: 08:00 -> 08:00:00)
const toApiTime = (val) => {
  if (!val || val.length < 5) return null;
  return `${val}:00`;
};

// Helper para ler formato da API (ex: 08:00:00 -> 08:00)
const fromApiTime = (val) => {
  if (!val) return '';
  return val.slice(0, 5);
};

export default function HorariosScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    fetchHorarios();
  }, []);

  async function fetchHorarios() {
    try {
      setLoading(true);
      const res = await api.get('/api/horarios-config/');
      const serverData = res.data;

      // Monta os 7 dias (0 a 6)
      const grade = [];
      for (let i = 0; i < 7; i++) {
        const diaNoServidor = serverData.find(d => d.dia_semana === i);
        if (diaNoServidor) {
          grade.push({
            id: diaNoServidor.id,
            dia_semana: i,
            ativo: diaNoServidor.ativo,
            horario_inicio: fromApiTime(diaNoServidor.horario_inicio),
            horario_fim: fromApiTime(diaNoServidor.horario_fim),
            almoco_inicio: fromApiTime(diaNoServidor.almoco_inicio),
            almoco_fim: fromApiTime(diaNoServidor.almoco_fim),
          });
        } else {
          grade.push({
            id: null,
            dia_semana: i,
            ativo: i < 5, // Seg a Sex true por padrao
            horario_inicio: '08:00',
            horario_fim: '18:00',
            almoco_inicio: '12:00',
            almoco_fim: '13:00',
          });
        }
      }
      setHorarios(grade);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar as configurações de horário.');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateDia = (index, field, value) => {
    const newHorarios = [...horarios];
    if (field === 'ativo') {
      newHorarios[index].ativo = value;
    } else {
      newHorarios[index][field] = formatTime(value);
    }
    setHorarios(newHorarios);
  };

  async function handleSalvar() {
    try {
      setSaving(true);
      
      // Para cada dia, enviar para a API
      const promises = horarios.map(dia => {
        const payload = {
          dia_semana: dia.dia_semana,
          ativo: dia.ativo,
          horario_inicio: toApiTime(dia.horario_inicio) || '08:00:00',
          horario_fim: toApiTime(dia.horario_fim) || '18:00:00',
          almoco_inicio: toApiTime(dia.almoco_inicio),
          almoco_fim: toApiTime(dia.almoco_fim),
        };

        if (dia.id) {
          // Atualiza
          return api.patch(`/api/horarios-config/${dia.id}/`, payload);
        } else {
          // Cria
          return api.post(`/api/horarios-config/`, payload);
        }
      });

      await Promise.all(promises);
      Alert.alert('Sucesso', 'Horários de funcionamento atualizados!');
      router.back();

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar os horários. Verifique se os campos de hora estão completos (ex: 08:00).');
    } finally {
      setSaving(false);
    }
  }

  const renderCardDia = (dia, index) => {
    return (
      <View key={index} style={[styles.card, !dia.ativo && styles.cardDesativado]}>
        <View style={styles.cardHeader}>
          <Text style={styles.diaText}>{DIAS_NOME[dia.dia_semana]}</Text>
          <Switch 
            value={dia.ativo} 
            onValueChange={(val) => handleUpdateDia(index, 'ativo', val)} 
            trackColor={{ false: '#CBD5E0', true: '#38B2AC' }}
            thumbColor={'#FFF'}
          />
        </View>

        {dia.ativo && (
          <View style={styles.horariosContainer}>
            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Abertura</Text>
                <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="08:00"
                  maxLength={5}
                  value={dia.horario_inicio}
                  onChangeText={(val) => handleUpdateDia(index, 'horario_inicio', val)}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Fechamento</Text>
                <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="18:00"
                  maxLength={5}
                  value={dia.horario_fim}
                  onChangeText={(val) => handleUpdateDia(index, 'horario_fim', val)}
                />
              </View>
            </View>

            <View style={[styles.row, { marginTop: 10 }]}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Almoço (Início)</Text>
                <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="12:00"
                  maxLength={5}
                  value={dia.almoco_inicio}
                  onChangeText={(val) => handleUpdateDia(index, 'almoco_inicio', val)}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Almoço (Fim)</Text>
                <TextInput 
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="13:00"
                  maxLength={5}
                  value={dia.almoco_fim}
                  onChangeText={(val) => handleUpdateDia(index, 'almoco_fim', val)}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Horários</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.instructionsText}>
            Defina os dias e horários gerais em que você trabalha. Isso afeta sua agenda.
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#003B73" style={{ marginTop: 40 }} />
          ) : (
            horarios.map((dia, index) => renderCardDia(dia, index))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={saving || loading}>
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Configurações</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: { flex: 1, padding: 20 },
  instructionsText: { color: '#718096', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#38B2AC'
  },
  cardDesativado: {
    backgroundColor: '#EDF2F7',
    borderLeftColor: '#CBD5E0',
    opacity: 0.7
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  diaText: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  horariosContainer: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  inputWrapper: { flex: 1 },
  label: { fontSize: 12, color: '#4A5568', marginBottom: 5, fontWeight: '600' },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: '#003B73',
    textAlign: 'center',
    letterSpacing: 2
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  saveButton: {
    backgroundColor: '#38B2AC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
