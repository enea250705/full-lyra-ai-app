import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useApi } from '../../hooks/useApi';
import { PlaidLinkButton } from './PlaidLinkButton';
import { ComingSoonCard } from './ComingSoonCard';
import { isFeatureEnabled, getComingSoonFeature } from '../../constants/features';

interface Account {
  accountId: string;
  name: string;
  type: string;
  subtype: string;
  balance: {
    available?: number;
    current: number;
    currency: string;
  };
}

interface SpendingAnalysis {
  totalSpent: number;
  averageTransaction: number;
  categoryBreakdown: Record<string, { amount: number; count: number }>;
  topMerchants: Array<{ merchant: string; amount: number; count: number }>;
  dailySpending: Record<string, number>;
}

interface SavingsOpportunity {
  type: string;
  description: string;
  potentialSavings: number;
  category: string;
  confidence: number;
}

export const FinancialDashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis | null>(null);
  const [savingsOpportunities, setSavingsOpportunities] = useState<SavingsOpportunity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { get } = useApi();

  // Check if Plaid feature is enabled
  const isPlaidEnabled = isFeatureEnabled('PLAID_FINANCE');

  useEffect(() => {
    // Check if user has connected accounts
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    // This would typically check if user has stored Plaid access token
    // For demo purposes, we'll assume not connected initially
    setIsConnected(false);
  };

  const loadFinancialData = async () => {
    if (!isConnected) return;

    try {
      setIsLoading(true);

      // Load accounts
      const accountsResponse = await get('/plaid/accounts', {
        headers: { 'x-plaid-access-token': 'stored_access_token' } // This should come from secure storage
      });
      if (accountsResponse.success) {
        setAccounts(accountsResponse.data.accounts);
      }

      // Load spending analysis
      const spendingResponse = await get('/plaid/analysis/spending', {
        headers: { 'x-plaid-access-token': 'stored_access_token' }
      });
      if (spendingResponse.success) {
        setSpendingAnalysis(spendingResponse.data.analysis);
      }

      // Load savings opportunities
      const savingsResponse = await get('/plaid/analysis/savings', {
        headers: { 'x-plaid-access-token': 'stored_access_token' }
      });
      if (savingsResponse.success) {
        setSavingsOpportunities(savingsResponse.data.opportunities.suggestions);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      Alert.alert('Error', 'Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFinancialData();
    setRefreshing(false);
  };

  const handlePlaidSuccess = (publicToken: string, metadata: any) => {
    setIsConnected(true);
    loadFinancialData();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Food and Drink': '🍽️',
      'Shops': '🛍️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Travel': '✈️',
      'Bills': '📄',
      'Other': '📊',
    };
    return icons[category] || '📊';
  };

  const handleNotifyMe = () => {
    Alert.alert(
      'Get Notified',
      'We\'ll notify you when Smart Financial Insights becomes available!',
      [{ text: 'OK' }]
    );
    // TODO: Store user's interest in notifications
  };

  // Show coming soon if feature is disabled
  if (!isPlaidEnabled) {
    const featureInfo = getComingSoonFeature('PLAID_FINANCE');
    
    return (
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        contentContainerStyle={{ padding: 20 }}
      >
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20 }}>
          Financial Dashboard
        </Text>
        
        <ComingSoonCard
          title={featureInfo.title}
          description={featureInfo.description}
          icon={featureInfo.icon}
          estimatedDate={featureInfo.estimatedDate}
          onNotifyMe={handleNotifyMe}
        />

        {/* Show current savings tracking as alternative */}
        <View style={{ 
          backgroundColor: '#FFFFFF', 
          borderRadius: 12, 
          padding: 20, 
          marginTop: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            🎯 Current Savings Tracking
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>
            Track your manual savings and spending interventions while we prepare the full financial integration.
          </Text>
          
          <View style={{ 
            backgroundColor: '#F0FDF4', 
            padding: 16, 
            borderRadius: 8,
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#065F46', marginBottom: 4 }}>
              Available Now:
            </Text>
            <Text style={{ fontSize: 14, color: '#047857', lineHeight: 20 }}>
              • Manual savings logging{'\n'}
              • Spending intervention tracking{'\n'}
              • Achievement system{'\n'}
              • Monthly savings goals
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!isConnected) {
    return (
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        contentContainerStyle={{ padding: 20 }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
            Connect Your Bank Account
          </Text>
          <Text style={{ fontSize: 16, color: '#64748B', marginBottom: 32, textAlign: 'center' }}>
            Get personalized financial insights and savings recommendations by connecting your bank account securely with Plaid.
          </Text>
          
          <PlaidLinkButton
            onSuccess={handlePlaidSuccess}
            buttonText="Connect Bank Account"
            style={{ width: '100%', maxWidth: 300 }}
          />
          
          <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 16, textAlign: 'center' }}>
            🔒 Your financial data is encrypted and secure. We never store your banking credentials.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20 }}>
          Financial Dashboard
        </Text>

        {/* Accounts Section */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Connected Accounts
          </Text>
          {accounts.map((account) => (
            <View key={account.accountId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '500' }}>{account.name}</Text>
                <Text style={{ fontSize: 14, color: '#64748B' }}>{account.type} • {account.subtype}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>
                {formatCurrency(account.balance.current, account.balance.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Spending Analysis */}
        {spendingAnalysis && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
              Spending Analysis (Last 30 Days)
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#EF4444' }}>
                  {formatCurrency(spendingAnalysis.totalSpent)}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Total Spent</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#3B82F6' }}>
                  {formatCurrency(spendingAnalysis.averageTransaction)}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>Avg Transaction</Text>
              </View>
            </View>

            <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8 }}>
              Top Categories
            </Text>
            {Object.entries(spendingAnalysis.categoryBreakdown)
              .sort(([,a], [,b]) => b.amount - a.amount)
              .slice(0, 5)
              .map(([category, data]) => (
                <View key={category} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>{getCategoryIcon(category)}</Text>
                    <Text style={{ fontSize: 14 }}>{category}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '500' }}>
                    {formatCurrency(data.amount)} ({data.count})
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Savings Opportunities */}
        {savingsOpportunities.length > 0 && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
              💡 Savings Opportunities
            </Text>
            {savingsOpportunities.slice(0, 5).map((opportunity, index) => (
              <View key={index} style={{ backgroundColor: '#F0FDF4', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 4 }}>
                      {opportunity.description}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>
                      {opportunity.category} • {Math.round(opportunity.confidence * 100)}% confidence
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#10B981' }}>
                    Save {formatCurrency(opportunity.potentialSavings)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};