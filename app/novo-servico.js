import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../src/services/api';

export default function NovoServicoScreen() {
  const params = useLocalSearchParams();
  const isEditing = !!params.id;

  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');

  useEffect(() => {
    if (isEditing) {
      setNome(params.nome || '');
      setPreco(params.preco ? String(params.preco) : '');
      setDuracao(params.duracao_minutos ? String(params.duracao_minutos) : '');
    }
  }, [isEditing]);

  async function handleSalvar() {
    if (!nome || !preco || !duracao) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const precoNumerico = parseFloat(preco.replace(',', '.'));
    if (isNaN(precoNumerico) || precoNumerico <= 0) {
      Alert.alert('Erro', 'Preço inválido.');
      return;
    }

    const duracaoNumerica = parseInt(duracao, 10);
    if (isNaN(duracaoNumerica) || duracaoNumerica <= 0) {
      Alert.alert('Erro', 'Duração inválida.');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        nome: nome,
        preco: precoNumerico,
        duracao_minutos: duracaoNumerica
      };

      if (isEditing) {
        await api.patch(`/api/servicos/${params.id}/`, payload);
        Alert.alert('Sucesso', 'Serviço atualizado com sucesso!');
      } else {
        await api.post('/api/servicos/', payload);
        Alert.alert('Sucesso', 'Serviço cadastrado com sucesso!');
      }
      
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o serviço.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Editar Serviço' : 'Novo Serviço'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Serviço</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Corte de Cabelo, Manutenção..."
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preço (R$)</Text>
            <TextInput
              style={[styles.input, styles.valorInput]}
              value={preco}
              onChangeText={setPreco}
              placeholder="0,00"
              placeholderTextColor="#A0AEC0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duração Estimada (minutos)</Text>
            <TextInput
              style={[styles.input, styles.valorInput]}
              value={duracao}
              onChangeText={setDuracao}
              placeholder="Ex: 30, 60..."
              placeholderTextColor="#A0AEC0"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSalvar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Cadastrar Serviço</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#003B73', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0  },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 
  },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  content: {
    flex: 1,
    backgroundColor: '#F4F7FE',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#2D3748',
    backgroundColor: '#F8FAFC',
  },
  valorInput: { fontSize: 18, fontWeight: 'bold', color: '#003B73' },
  saveButton: { backgroundColor: '#38B2AC', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
