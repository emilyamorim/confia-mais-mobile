import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  TextInput, ScrollView, ActivityIndicator, Alert, Image
, Platform, StatusBar} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/services/api';

export default function PerfilScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_completo: '',
    telefone: '',
    descricao: '',
    endereco: '',
    bairro: '',
    cidade: ''
  });

  const [userData, setUserData] = useState({
    email: '',
    username: ''
  });

  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/users/me/');
      const data = response.data;
      
      setFormData({
        nome_completo: data.nome_completo || '',
        telefone: data.telefone || '',
        descricao: data.descricao || '',
        endereco: data.endereco || '',
        bairro: data.bairro || '',
        cidade: data.cidade || ''
      });
      
      setUserData({
        email: data.email || '',
        username: data.username || ''
      });

      if (data.foto) {
        setProfileImage(data.foto);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    } finally {
      setLoading(false);
    }
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  async function handleSave() {
    try {
      setSaving(true);
      
      let isMultipart = false;
      const dataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        dataToSend.append(key, formData[key] || '');
      });

      // Se a imagem for uma URI local (file://), significa que o usuario acabou de trocar
      if (profileImage && !profileImage.startsWith('http')) {
        const filename = profileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        dataToSend.append('foto', {
          uri: profileImage,
          name: filename,
          type,
        });
        isMultipart = true;
      }

      if (isMultipart) {
        await api.patch('/api/auth/users/me/', dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.patch('/api/auth/users/me/', formData);
      }

      Alert.alert('Sucesso', 'Dados pessoais e foto atualizados com sucesso!');
      router.back();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Verifique sua conexão.';
      Alert.alert('Erro ao Salvar', msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dados Pessoais</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* AVATAR UPLOAD */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={40} color="#003B73" />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="pencil" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.readonlyField}>
            <Text style={styles.label}>E-mail (Login)</Text>
            <Text style={styles.readonlyText}>{userData.email}</Text>
          </View>
          
          <View style={styles.readonlyField}>
            <Text style={styles.label}>Usuário</Text>
            <Text style={styles.readonlyText}>@{userData.username}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={formData.nome_completo}
              onChangeText={(text) => setFormData({...formData, nome_completo: text})}
              placeholder="Digite seu nome completo"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone (WhatsApp)</Text>
            <TextInput
              style={styles.input}
              value={formData.telefone}
              onChangeText={(text) => setFormData({...formData, telefone: text})}
              placeholder="(00) 90000-0000"
              placeholderTextColor="#A0AEC0"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sobre a Loja / Profissional</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descricao}
              onChangeText={(text) => setFormData({...formData, descricao: text})}
              placeholder="Fale um pouco sobre seus serviços..."
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4}
            />
          </View>

          <Text style={styles.sectionTitle}>Localização</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Endereço (Rua e Número)</Text>
            <TextInput
              style={styles.input}
              value={formData.endereco}
              onChangeText={(text) => setFormData({...formData, endereco: text})}
              placeholder="Ex: Rua das Flores, 123"
              placeholderTextColor="#A0AEC0"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Bairro</Text>
              <TextInput
                style={styles.input}
                value={formData.bairro}
                onChangeText={(text) => setFormData({...formData, bairro: text})}
                placeholder="Centro"
                placeholderTextColor="#A0AEC0"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput
                style={styles.input}
                value={formData.cidade}
                onChangeText={(text) => setFormData({...formData, cidade: text})}
                placeholder="Sua Cidade"
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#003B73" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#003B73', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#FFFFFF', marginTop: 15, fontSize: 14 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 
  },
  backButton: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center' 
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  scrollContent: { 
    paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40,
    backgroundColor: '#F4F7FE', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    flexGrow: 1
  },
  avatarContainer: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { 
    width: 100, height: 100, borderRadius: 50, 
    backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center',
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#38B2AC', width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF'
  },
  avatarHint: { color: '#718096', fontSize: 12, marginTop: 10 },
  formContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A202C', marginTop: 15, marginBottom: 15 },
  readonlyField: { marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  label: { fontSize: 13, fontWeight: '600', color: '#718096', marginBottom: 6 },
  readonlyText: { fontSize: 15, color: '#4A5568', fontWeight: '500' },
  inputGroup: { marginBottom: 16 },
  input: { 
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', 
    borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, 
    fontSize: 15, color: '#1A202C' 
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: { 
    padding: 20, backgroundColor: '#F4F7FE', 
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
    paddingBottom: 30
  },
  saveButton: { 
    backgroundColor: '#90CDF4', paddingVertical: 15, borderRadius: 12, 
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 
  },
  saveButtonText: { color: '#003B73', fontSize: 16, fontWeight: 'bold' }
});
