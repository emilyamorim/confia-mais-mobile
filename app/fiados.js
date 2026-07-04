import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, ActivityIndicator, Alert, Linking
, Platform, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';

export default function FiadosScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ inadimplentes: [], totalDevido: 0, quantidade: 0 });

  useEffect(() => {
    fetchInadimplentes();
  }, []);

  async function fetchInadimplentes() {
    try {
      setLoading(true);
      const response = await api.get('/api/inadimplencia/');
      setData(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de devedores.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReceber(transacaoId, valorRestante, clienteNome) {
    Alert.alert(
      "Confirmar Recebimento",
      `Receber R$ ${valorRestante.toFixed(2).replace('.', ',')} de ${clienteNome} via PIX?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              // Obtém a data de hoje no formato YYYY-MM-DD
              const hoje = new Date().toISOString().split('T')[0];
              await api.post('/api/pagamentos/', {
                transacao: transacaoId,
                valor: valorRestante,
                forma_pagamento: 'PIX',
                data_pagamento: hoje
              });
              Alert.alert('Sucesso', 'Baixa realizada com sucesso!');
              fetchInadimplentes(); // Recarrega a lista
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Não foi possível processar o pagamento.');
            }
          }
        }
      ]
    );
  }

  function handleWhatsApp(telefone, nome, servico, valor) {
    if (!telefone) {
      Alert.alert('Erro', 'Telefone não disponível.');
      return;
    }
    const text = `Olá ${nome}, tudo bem? Aqui é do Confia+. Estou passando para lembrar do valor pendente de R$ ${valor.toFixed(2).replace('.', ',')} referente ao serviço de ${servico}. Podemos verificar?`;
    Linking.openURL(`whatsapp://send?phone=${telefone}&text=${encodeURIComponent(text)}`);
  }

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clienteNome}>{item.cliente}</Text>
        <Text style={styles.valorBadge}>R$ {item.valor.toFixed(2).replace('.', ',')}</Text>
      </View>
      <Text style={styles.servicoText}>{item.servico}</Text>
      <View style={styles.statusRow}>
        <Ionicons name="time-outline" size={16} color="#DD6B20" />
        <Text style={styles.statusText}>{item.diasAtraso} dias de atraso (Desde {item.dataConclusao})</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.btnWhatsapp}
          onPress={() => handleWhatsApp(item.telefone, item.cliente, item.servico, item.valor)}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.btnText}>Cobrar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.btnReceber}
          onPress={() => handleReceber(item.id, item.valor, item.cliente)}
        >
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.btnText}>Dar Baixa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fiados / A Receber</Text>
        <TouchableOpacity onPress={fetchInadimplentes}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Total a Receber</Text>
        <Text style={styles.summaryValue}>R$ {data.totalDevido.toFixed(2).replace('.', ',')}</Text>
        <Text style={styles.summarySubtitle}>{data.quantidade} clientes pendentes</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#003B73" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={data.inadimplentes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum fiado pendente! 🎉</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#003B73', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0  },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 
  },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  summaryBox: { alignItems: 'center', paddingBottom: 20 },
  summaryTitle: { color: '#A0AEC0', fontSize: 14, fontWeight: '600' },
  summaryValue: { color: '#FBD38D', fontSize: 32, fontWeight: 'bold', marginVertical: 5 },
  summarySubtitle: { color: '#E2E8F0', fontSize: 13 },
  content: {
    flex: 1,
    backgroundColor: '#F4F7FE',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  listContainer: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  clienteNome: { fontSize: 16, fontWeight: 'bold', color: '#1A202C' },
  valorBadge: { fontSize: 16, fontWeight: 'bold', color: '#DD6B20' },
  servicoText: { fontSize: 14, color: '#4A5568', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusText: { fontSize: 12, color: '#DD6B20', marginLeft: 5, fontWeight: '600' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btnWhatsapp: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#38A169', 
    paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flex: 1, marginRight: 10, justifyContent: 'center' 
  },
  btnReceber: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#003B73', 
    paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flex: 1, justifyContent: 'center' 
  },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginLeft: 5 },
  emptyText: { textAlign: 'center', color: '#718096', marginTop: 50, fontSize: 16 }
});
