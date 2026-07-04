import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Image , Platform, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LogoSvg from '../assets/images/logotipo1.svg';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* CABEÇALHO / LOGO */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LogoSvg width={80} height={80} />
          </View>
          <Text style={styles.title}>Confia+</Text>
          <Text style={styles.subtitle}>O controle definitivo do seu negócio</Text>
        </View>

        {/* CARDS EXPLICATIVOS */}
        <View style={styles.cardsContainer}>
          
          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#E6FFFA' }]}>
              <Ionicons name="bar-chart" size={24} color="#38B2AC" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Gestão Inteligente</Text>
              <Text style={styles.cardDescription}>
                Controle total de fluxo de caixa, despesas e margem de lucro na palma da mão.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#EBF8FF' }]}>
              <Ionicons name="hardware-chip" size={24} color="#3182CE" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Painel IoT Integrado</Text>
              <Text style={styles.cardDescription}>
                Sincronização em tempo real com hardware na bancada para não perder nenhum atendimento.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: '#FFFAF0' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#DD6B20" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Controle de Inadimplência</Text>
              <Text style={styles.cardDescription}>
                Rastreamento automático de fiados e pagamentos pendentes dos seus clientes.
              </Text>
            </View>
          </View>

        </View>

        {/* BOTÕES DE AÇÃO */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryButtonText}>Já tenho uma conta</Text>
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.secondaryButtonText}>Criar Conta</Text>
            <Ionicons name="person-add-outline" size={20} color="#003B73" />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#003B73', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0  },
  container: { flex: 1, padding: 25, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: 40 },
  logoContainer: { 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#90CDF4', marginTop: 5, textAlign: 'center' },
  
  cardsContainer: { flex: 1, justifyContent: 'center', gap: 20 },
  card: { 
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3
  },
  iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  cardDescription: { fontSize: 13, color: '#718096', lineHeight: 18 },

  footer: { marginBottom: 20, gap: 15 },
  primaryButton: { 
    backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 16, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { 
    backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10
  },
  secondaryButtonText: { color: '#003B73', fontSize: 16, fontWeight: 'bold' }
});