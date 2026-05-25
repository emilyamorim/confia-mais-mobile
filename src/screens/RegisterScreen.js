import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, SafeAreaView 
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import api from '../services/api';
import LogoSvg from '../../assets/images/logotipo.svg'; 

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Novo estado para o Celular
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Função para aplicar a máscara (XX) XXXXX-XXXX em tempo real
  const handlePhoneChange = (text) => {
    // Remove tudo que não for número
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;

    if (cleaned.length > 2) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
    }
    if (cleaned.length > 7) {
      formatted = `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    }
    
    setPhone(formatted);
  };

  async function handleRegister() {
    // Agora valida o telefone também
    if (!username || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Aviso', 'Preencha todos os campos!');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem. Tente novamente.');
      return;
    }

    try {
      setLoading(true);
      
      // Enviando o telefone limpo (só os números) ou formatado, dependendo do seu back-end
      const telefoneLimpo = phone.replace(/\D/g, '');

      await api.post('/api/auth/register/', { 
        username, 
        email, 
        telefone: telefoneLimpo, // Novo campo indo para o Django
        password 
      });
      
      Alert.alert('Sucesso!', 'Conta criada com sucesso no Confia+! Faça seu login.');
      router.back();

    } catch (error) {
      console.error(error);
      Alert.alert('Erro no Cadastro', 'Não foi possível criar a conta. Verifique os dados ou tente outro nome de usuário.');
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
          
          <View style={styles.card}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#A0AEC0" />
            </TouchableOpacity>

            <View style={styles.cardHeader}>
              <View style={styles.logoCircle}>
                 <LogoSvg width={28} height={28} /> 
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>Cadastro</Text>
                <Text style={styles.subtitle}>Crie sua conta no Confia+</Text>
              </View>
            </View>

            {/* USUÁRIO */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>USUÁRIO</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person" size={18} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Escolha um nome de usuário"
                  placeholderTextColor="#A0AEC0"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* E-MAIL */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>E-MAIL</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={18} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Digite seu melhor e-mail"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* CELULAR (NOVO CAMPO) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>CELULAR</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="phone-portrait-outline" size={18} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#A0AEC0"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad" // Abre o teclado de números
                  maxLength={15} // Limita o tamanho para evitar textos infinitos
                />
              </View>
            </View>

            {/* SENHA */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>SENHA</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={18} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Crie uma senha forte"
                  placeholderTextColor="#A0AEC0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#A0AEC0" />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIRMAR SENHA */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>CONFIRMAR SENHA</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="checkmark-circle" size={18} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Repita sua senha"
                  placeholderTextColor="#A0AEC0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>CRIAR CONTA</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Estilos mantidos exatamente iguais para não quebrar o layout
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#001F3F' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    backgroundColor: '#FFFFFF', width: '100%', maxWidth: 400, borderRadius: 24, 
    padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, position: 'relative'
  },
  backButton: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  logoCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  titleWrapper: { justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#001F3F' },
  subtitle: { fontSize: 13, color: '#A0AEC0', marginTop: 2 },
  formGroup: { marginBottom: 15 },
  label: { fontSize: 11, fontWeight: 'bold', color: '#001F3F', marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#FAFCFF', height: 50, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#1A202C', fontSize: 15, height: '100%' },
  eyeIcon: { padding: 5 },
  primaryButton: { backgroundColor: '#001F3F', height: 50, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 }
});