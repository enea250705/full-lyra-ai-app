import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>About Lyra</Text>
        <Text style={styles.subtitle}>Your Personal Life Operating System</Text>
      </View>
      
      <View style={styles.imageContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>Lyra</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.sectionText}>
          Lyra helps you live with clarity, alignment, and peace by offering intelligent, 
          emotional daily support. We believe in creating technology that enhances your 
          wellbeing and helps you make better decisions.
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Daily Check-ins</Text>
          <Text style={styles.featureText}>
            Track your mood, energy, and sleep patterns to identify trends and improve wellbeing.
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>AI Companion</Text>
          <Text style={styles.featureText}>
            Chat with Lyra for support, guidance, and reflection on your daily experiences.
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Journal</Text>
          <Text style={styles.featureText}>
            Capture your thoughts and reflections with guided prompts to develop self-awareness.
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Insights</Text>
          <Text style={styles.featureText}>
            Discover patterns and receive personalized suggestions based on your data.
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.sectionText}>
          Your data is private and secure. We use end-to-end encryption and never share your 
          personal information with third parties without your explicit consent.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Close"
          onPress={() => router.back()}
          variant="primary"
          fullWidth
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Lyra AI • All Rights Reserved</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.midnightBlue,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.midnightBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.white,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    color: colors.gray[700],
    lineHeight: 24,
  },
  featureItem: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.midnightBlue,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.gray[500],
  },
});