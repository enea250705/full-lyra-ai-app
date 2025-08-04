import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MapPin, AlertTriangle, ShoppingBag, X } from 'lucide-react-native';

interface ExpensiveStore {
  name: string;
  category: string;
  distance: number;
  priceLevel: 'expensive' | 'very_expensive' | 'luxury';
  address: string;
}

interface ExpensiveStoreAlertProps {
  stores: ExpensiveStore[];
  onDismiss?: () => void;
  onConfirmSavings?: (actualAmount: number, originalAmount: number, reason: string) => void;
  style?: any;
}

const getPriceLevelColor = (priceLevel: string) => {
  switch (priceLevel) {
    case 'expensive':
      return '#FF9500';
    case 'very_expensive':
      return '#FF6B35';
    case 'luxury':
      return '#FF3B30';
    default:
      return '#FF9500';
  }
};

const getPriceLevelText = (priceLevel: string) => {
  switch (priceLevel) {
    case 'expensive':
      return 'Expensive';
    case 'very_expensive':
      return 'Very Expensive';
    case 'luxury':
      return 'Luxury';
    default:
      return 'Expensive';
  }
};

const ExpensiveStoreAlert: React.FC<ExpensiveStoreAlertProps> = ({ 
  stores, 
  onDismiss, 
  onConfirmSavings,
  style 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (stores.length === 0) {
    return null;
  }

  const nearbyStores = stores.filter(store => store.distance < 500);
  const luxuryStores = stores.filter(store => store.priceLevel === 'luxury');

  const getAlertLevel = () => {
    if (luxuryStores.length > 2) return 'high';
    if (nearbyStores.length > 3) return 'medium';
    return 'low';
  };

  const getAlertColor = () => {
    const level = getAlertLevel();
    switch (level) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#FFD60A';
      default:
        return '#FF9500';
    }
  };

  const getAlertMessage = () => {
    const level = getAlertLevel();
    switch (level) {
      case 'high':
        return `⚠️ High spending risk! ${luxuryStores.length} luxury stores nearby`;
      case 'medium':
        return `💰 Moderate spending risk! ${nearbyStores.length} expensive stores nearby`;
      case 'low':
        return `📍 Expensive stores detected in your area`;
      default:
        return 'Expensive stores detected';
    }
  };

  const handleStorePress = (store: ExpensiveStore) => {
    Alert.alert(
      store.name,
      `${getPriceLevelText(store.priceLevel)} store - ${store.distance}m away\n\n${store.address}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remind me to budget', style: 'default' },
        { 
          text: 'Avoided shopping here', 
          style: 'default',
          onPress: () => handleAvoidedShopping(store)
        },
      ]
    );
  };

  const handleAvoidedShopping = (store: ExpensiveStore) => {
    const estimatedSpending = getEstimatedSpendingForStore(store.priceLevel);
    
    Alert.alert(
      'Confirm Savings',
      `How much would you have spent at ${store.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: `~€${estimatedSpending}`, 
          onPress: () => confirmSavings(estimatedSpending, store)
        },
        { 
          text: 'Custom amount', 
          onPress: () => showCustomAmountDialog(store)
        },
      ]
    );
  };

  const getEstimatedSpendingForStore = (priceLevel: string): number => {
    switch (priceLevel) {
      case 'luxury':
        return 200;
      case 'very_expensive':
        return 100;
      case 'expensive':
        return 50;
      default:
        return 30;
    }
  };

  const confirmSavings = (originalAmount: number, store: ExpensiveStore) => {
    if (onConfirmSavings) {
      onConfirmSavings(
        0, // actualAmount - they avoided shopping
        originalAmount,
        `Avoided shopping at ${store.name} (${getPriceLevelText(store.priceLevel)} store)`
      );
    }
  };

  const showCustomAmountDialog = (store: ExpensiveStore) => {
    Alert.prompt(
      'Custom Amount',
      'How much would you have spent?',
      (text) => {
        const amount = parseFloat(text);
        if (!isNaN(amount) && amount > 0) {
          confirmSavings(amount, store);
        }
      },
      'plain-text',
      '',
      'numeric'
    );
  };

  return (
    <View style={[styles.container, { borderColor: getAlertColor() }, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerLeft}>
          <AlertTriangle size={20} color={getAlertColor()} />
          <Text style={[styles.alertText, { color: getAlertColor() }]}>
            {getAlertMessage()}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <X size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.storesList} showsVerticalScrollIndicator={false}>
          {stores.slice(0, 10).map((store, index) => (
            <TouchableOpacity
              key={index}
              style={styles.storeItem}
              onPress={() => handleStorePress(store)}
            >
              <View style={styles.storeInfo}>
                <View style={styles.storeHeader}>
                  <ShoppingBag size={16} color="#666" />
                  <Text style={styles.storeName}>{store.name}</Text>
                  <View style={[
                    styles.priceBadge,
                    { backgroundColor: getPriceLevelColor(store.priceLevel) }
                  ]}>
                    <Text style={styles.priceBadgeText}>
                      {getPriceLevelText(store.priceLevel)}
                    </Text>
                  </View>
                </View>
                <View style={styles.storeDetails}>
                  <View style={styles.storeDetailItem}>
                    <MapPin size={12} color="#999" />
                    <Text style={styles.storeDistance}>{store.distance}m away</Text>
                  </View>
                  <Text style={styles.storeAddress}>{store.address}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {stores.length > 10 && (
            <Text style={styles.moreStoresText}>
              +{stores.length - 10} more stores nearby
            </Text>
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 Tip: Set a spending budget before shopping to avoid impulse purchases
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  storesList: {
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  storeItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  storeInfo: {
    flex: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priceBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  storeDetails: {
    marginLeft: 22,
  },
  storeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  storeDistance: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  storeAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  moreStoresText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    padding: 12,
    fontStyle: 'italic',
  },
  footer: {
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default ExpensiveStoreAlert;