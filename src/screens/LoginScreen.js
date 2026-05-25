import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, SafeAreaView, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import api from '../services/api';
import LogoSvg from '../../assets/images/logotipo-light.svg';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!username || !password) {
      Alert.alert('Aviso', 'Preencha usuário e senha!');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/auth/login/', { username, password });
      
      const { access, refresh, tipo_usuario } = response.data;

      await AsyncStorage.setItem('access_token', access);
      if (refresh) await AsyncStorage.setItem('refresh_token', refresh);
      await AsyncStorage.setItem('user_type', tipo_usuario);

      api.defaults.headers.Authorization = `Bearer ${access}`;
      router.replace('/dashboard');

    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          
          {/* CARD BRANCO CENTRALIZADO */}
          <View style={styles.card}>
            
            {/* CABEÇALHO DO CARD (Logo e Títulos) */}
            <View style={styles.cardHeader}>
            
            <View style={styles.logoCircle}>
                <LogoSvg width={28} height={28} /> 
            </View>
            
            <View style={styles.titleWrapper}>
                <Text style={styles.title}>Login</Text>
                <Text style={styles.subtitle}>Bem-vindo de volta!</Text>
            </View>
            </View>

            {/* FORMULÁRIO */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>USUÁRIO</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={18} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Digite seu usuário"
                  placeholderTextColor="#A0AEC0"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>SENHA</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={18} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#A0AEC0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#A0AEC0" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
              </TouchableOpacity>
            </View>

            {/* BOTÃO PRIMÁRIO (ENTRAR) */}
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>ENTRAR</Text>
                  <Ionicons name="log-in-outline" size={20} color="#FFFFFF" style={styles.btnIcon} />
                </>
              )}
            </TouchableOpacity>

            {/* DIVISOR (OU) */}
            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.line} />
            </View>

            {/* BOTÃO SECUNDÁRIO (CRIAR CONTA) */}
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/register')} // <- Esta é a linha mágica!
            >
              <Text style={styles.secondaryButtonText}>Criar conta agora</Text>
              <Ionicons name="arrow-forward" size={18} color="#001F3F" style={styles.btnIcon} />
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#001F3F', // Azul Escuro de fundo do site
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: 24, // Arredondamento idêntico ao do print
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 35,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0D47A1', // Cor temporária da logo
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  titleWrapper: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#001F3F',
    // fontFamily: 'serif', // Remova o comentário se quiser forçar fonte com serifa no Android
  },
  subtitle: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#001F3F',
    marginBottom: 8,
    letterSpacing: 0.5, // Dá aquele ar espaçado nas letras maiúsculas
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0', // Borda cinza bem clarinha
    borderRadius: 8, // Borda um pouco mais quadrada como no site
    backgroundColor: '#FAFCFF',
    height: 50,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#1A202C',
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  forgotPasswordText: {
    color: '#A0AEC0',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#001F3F', // Azul escuro do botão
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  btnIcon: {
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#001F3F',
    fontSize: 14,
    fontWeight: 'bold',
  }
});