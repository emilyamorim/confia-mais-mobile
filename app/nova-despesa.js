import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch 
, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';

export default function NovaDespesaScreen() {
  const [loading, setLoading] = useState(false);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Variável'); // Padrão
  const [pago, setPago] = useState(false);

  async function handleSalvar() {
    if (!valor || !descricao) {
      Alert.alert('Erro', 'Por favor, preencha o valor e a descrição.');
      return;
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      Alert.alert('Erro', 'Valor inválido.');
      return;
    }

    try {
      setLoading(true);
      // Obtém a data de hoje no formato YYYY-MM-DD
      const hoje = new Date().toISOString().split('T')[0];

      await api.post('/api/despesas/', {
        valor: valorNumerico,
        descricao: descricao,
        categoria: categoria,
        data: hoje,
        pago: pago
      });

      Alert.alert('Sucesso', 'Despesa lançada com sucesso!');
      router.back(); // Volta para o Dashboard e ao puxar para baixo, vai atualizar
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar a despesa.');
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
        <Text style={styles.headerTitle}>Nova Despesa</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.content}
      >
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={[styles.input, styles.valorInput]}
              value={valor}
              onChangeText={setValor}
              placeholder="0,00"
              placeholderTextColor="#A0AEC0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição do Gasto</Text>
            <TextInput
              style={styles.input}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Ex: Conta de Luz, Material..."
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryRow}>
              <TouchableOpacity 
                style={[styles.categoryBtn, categoria === 'Fixo' && styles.categoryBtnActive]}
                onPress={() => setCategoria('Fixo')}
              >
                <Text style={[styles.categoryText, categoria === 'Fixo' && styles.categoryTextActive]}>Custo Fixo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryBtn, categoria === 'Variável' && styles.categoryBtnActive]}
                onPress={() => setCategoria('Variável')}
              >
                <Text style={[styles.categoryText, categoria === 'Variável' && styles.categoryTextActive]}>Custo Variável</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.switchLabel}>Esta despesa já está paga?</Text>
              <Text style={styles.switchSubLabel}>O valor será debitado do seu balanço no Dashboard.</Text>
            </View>
            <Switch
              trackColor={{ false: "#CBD5E0", true: "#38B2AC" }}
              thumbColor={pago ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#CBD5E0"
              onValueChange={setPago}
              value={pago}
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
              <Text style={styles.saveButtonText}>Registrar Despesa</Text>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#4A5568', marginBottom: 8 },
  input: { 
    backgroundColor: '#EDF2F7', borderWidth: 1, borderColor: '#E2E8F0', 
    borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, 
    fontSize: 16, color: '#1A202C' 
  },
  valorInput: { fontSize: 24, fontWeight: 'bold', color: '#E53E3E', textAlign: 'center' },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryBtn: {
    flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#CBD5E0',
    borderRadius: 8, alignItems: 'center', marginHorizontal: 5
  },
  categoryBtnActive: { backgroundColor: '#E53E3E', borderColor: '#E53E3E' },
  categoryText: { color: '#4A5568', fontWeight: '500' },
  categoryTextActive: { color: '#38B2AC', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#003B73', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    backgroundColor: '#F7FAFC',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchLabel: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: 'bold',
  },
  switchSubLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
    maxWidth: 220,
  }
});
