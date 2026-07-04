import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert
, Platform, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';

export default function CaixaScreen() {
  const [dadosCaixa, setDadosCaixa] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchCaixa() {
    try {
      setLoading(true);
      const res = await api.get('/api/financeiro/saude-financeira/');
      setDadosCaixa(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do caixa.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCaixa();
  }, []);

  const renderFluxoCaixa = () => {
    if (!dadosCaixa || !dadosCaixa.grafico_fluxo || dadosCaixa.grafico_fluxo.length === 0) return null;

    const fluxo = dadosCaixa.grafico_fluxo;
    const maxVal = Math.max(...fluxo.map(f => Math.max(f.entradas, f.saidas, 1)));
    const MAX_HEIGHT = 120;

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Fluxo de Caixa (Últimos 5 meses)</Text>
        <Text style={styles.chartSubtitle}>Comparativo entre Entradas (Verde) e Saídas (Vermelho)</Text>
        
        <View style={styles.barChartContainer}>
          {fluxo.map((item, index) => {
            const hEntrada = (item.entradas / maxVal) * MAX_HEIGHT;
            const hSaida = (item.saidas / maxVal) * MAX_HEIGHT;

            return (
              <View key={index} style={styles.barGroup}>
                <View style={styles.barsWrapper}>
                  {/* Barra Verde (Entrada) */}
                  <View style={styles.barColumn}>
                    <Text style={styles.barValueText}>{item.entradas > 0 ? 'R$' + Math.round(item.entradas) : ''}</Text>
                    <View style={[styles.bar, { height: hEntrada, backgroundColor: '#38B2AC' }]} />
                  </View>
                  
                  {/* Barra Vermelha (Saída) */}
                  <View style={styles.barColumn}>
                    <Text style={styles.barValueText}>{item.saidas > 0 ? 'R$' + Math.round(item.saidas) : ''}</Text>
                    <View style={[styles.bar, { height: hSaida, backgroundColor: '#E53E3E' }]} />
                  </View>
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderInadimplencia = () => {
    if (!dadosCaixa || !dadosCaixa.grafico_inadimplencia) return null;

    const inad = dadosCaixa.grafico_inadimplencia;
    const totalInad = inad.reduce((acc, curr) => acc + curr.value, 0);

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Risco de Inadimplência (Fiados)</Text>
        <Text style={styles.chartSubtitle}>Total a receber: R$ {totalInad.toFixed(2).replace('.', ',')}</Text>

        <View style={styles.horizontalChartContainer}>
          {inad.map((item, index) => {
            const pct = totalInad > 0 ? (item.value / totalInad) * 100 : 0;
            return (
              <View key={index} style={styles.hBarRow}>
                <View style={styles.hBarLabelArea}>
                  <Text style={styles.hBarLabel}>{item.name}</Text>
                  <Text style={styles.hBarValue}>R$ {item.value.toFixed(2).replace('.', ',')}</Text>
                </View>
                <View style={styles.hBarTrack}>
                  <View style={[styles.hBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                </View>
              </View>
            );
          })}
        </View>
        <TouchableOpacity style={styles.btnAcaoList} onPress={() => router.push('/fiados')}>
          <Text style={styles.btnAcaoText}>Gerenciar Fiados</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caixa e Saúde</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#003B73" style={{ marginTop: 50 }} />
        ) : dadosCaixa && dadosCaixa.metricas ? (
          <View style={styles.metricsContainer}>
            
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="pie-chart" size={24} color="#003B73" />
                <Text style={styles.metricLabel}>Margem de Lucro</Text>
              </View>
              <Text style={styles.metricValue}>{dadosCaixa.metricas.margem_lucro}%</Text>
              <Text style={styles.metricHelpText}>
                Percentual de lucro que resta após abater as despesas dos serviços prestados.
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="scale" size={24} color="#38B2AC" />
                <Text style={styles.metricLabel}>Ponto de Equilíbrio</Text>
              </View>
              <Text style={styles.metricValue}>R$ {dadosCaixa.metricas.ponto_equilibrio.toFixed(2).replace('.', ',')}</Text>
              <Text style={styles.metricHelpText}>
                O mínimo exato que você precisa faturar para não ter prejuízo no final do mês.
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="water" size={24} color="#E53E3E" />
                <Text style={styles.metricLabel}>Liquidez</Text>
              </View>
              <Text style={styles.metricValue}>{dadosCaixa.metricas.liquidez}</Text>
              <Text style={styles.metricHelpText}>
                Acima de 1.0 significa que as entradas cobrem folgadamente suas despesas.
              </Text>
            </View>
            
            {/* Gráfico de Barras - Fluxo */}
            {renderFluxoCaixa()}

            <TouchableOpacity 
              style={styles.btnDespesasLarge}
              onPress={() => router.push('/despesas')}
            >
              <Ionicons name="wallet-outline" size={20} color="#FFF" style={{marginRight: 8}}/>
              <Text style={styles.btnDespesasLargeText}>Controle de Despesas</Text>
            </TouchableOpacity>

            {/* Gráfico Horizontal - Inadimplência */}
            {renderInadimplencia()}

            <View style={{height: 40}} />
          </View>
        ) : (
          <Text style={styles.emptyText}>Sem dados no momento.</Text>
        )}
      </ScrollView>
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
  metricsContainer: { gap: 15 },
  
  // Cards de Métricas
  metricCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  metricLabel: { fontSize: 16, color: '#4A5568', marginLeft: 8, fontWeight: '600' },
  metricValue: { fontSize: 28, fontWeight: 'bold', color: '#003B73', marginBottom: 5 },
  metricHelpText: { fontSize: 12, color: '#718096', fontStyle: 'italic', lineHeight: 16 },

  // Botão Grande Despesas
  btnDespesasLarge: {
    backgroundColor: '#003B73',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  btnDespesasLargeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Containers de Gráficos
  chartCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 10
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  chartSubtitle: { fontSize: 12, color: '#718096', marginBottom: 20 },

  // Barras Verticais (Fluxo)
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 5
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 120,
    gap: 2
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  barValueText: {
    fontSize: 8,
    color: '#A0AEC0',
    marginBottom: 2
  },
  bar: {
    width: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 10,
    color: '#4A5568',
    fontWeight: '600'
  },

  // Barras Horizontais (Inadimplência)
  horizontalChartContainer: {
    marginBottom: 15
  },
  hBarRow: {
    marginBottom: 12
  },
  hBarLabelArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  hBarLabel: { fontSize: 13, color: '#4A5568', fontWeight: '500' },
  hBarValue: { fontSize: 13, color: '#2D3748', fontWeight: 'bold' },
  hBarTrack: {
    height: 10,
    backgroundColor: '#EDF2F7',
    borderRadius: 5,
    overflow: 'hidden'
  },
  hBarFill: {
    height: '100%',
    borderRadius: 5
  },

  btnAcaoList: {
    backgroundColor: '#003B73',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5
  },
  btnAcaoText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, marginRight: 5 },

  emptyText: { textAlign: 'center', color: '#718096', marginTop: 20, fontSize: 16 },
});
