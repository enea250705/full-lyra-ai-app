import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Lucide } from 'lucide-react-native';

interface ComingSoonCardProps {
  title: string;
  description: string;
  icon?: string;
  estimatedDate?: string;
  onNotifyMe?: () => void;
}

export const ComingSoonCard: React.FC<ComingSoonCardProps> = ({
  title,
  description,
  icon = "🚀",
  estimatedDate,
  onNotifyMe,
}) => {
  return (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    }}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>{icon}</Text>
        <View style={{
          backgroundColor: '#FEF3C7',
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 12,
          marginBottom: 12,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#92400E',
          }}>
            COMING SOON
          </Text>
        </View>
      </View>

      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1F2937',
      }}>
        {title}
      </Text>

      <Text style={{
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
      }}>
        {description}
      </Text>

      {estimatedDate && (
        <Text style={{
          fontSize: 12,
          color: '#9CA3AF',
          textAlign: 'center',
          marginBottom: 16,
          fontStyle: 'italic',
        }}>
          Expected: {estimatedDate}
        </Text>
      )}

      {onNotifyMe && (
        <TouchableOpacity
          onPress={onNotifyMe}
          style={{
            backgroundColor: '#F3F4F6',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#374151',
            marginRight: 8,
          }}>
            Notify Me
          </Text>
          <Text style={{ fontSize: 14 }}>🔔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};