import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Agendamentos() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FE', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#001F3F' }}>Em breve: Tela de Agendamentos</Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, padding: 10, backgroundColor: '#001F3F', borderRadius: 8 }}>
        <Text style={{ color: 'white' }}>Voltar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}