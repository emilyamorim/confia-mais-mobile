import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vinda ao Painel do Confia+!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#002B55' 
  }
});