import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { 
  getAllTransactions, 
  getTransactionsByClient, 
  getTransactionsByAgent,
  TransaccionResponse,
  TipoTransaccion 
} from '../api/transactions';
import { getUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import { useToast } from '../components/ToastProvider';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../styles/colors';

type TransactionsListNavigationProp = StackNavigationProp<RootStackParamList, 'TransactionsList'>;

export default function TransactionsListScreen() {
  const navigation = useNavigation<TransactionsListNavigationProp>();
  const [transactions, setTransactions] = useState<TransaccionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my' | 'client' | 'agent'>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadUserAndTransactions();
  }, [filter]);

  const loadUserAndTransactions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const userProfile = await getUserProfile();
      setCurrentUser(userProfile);

      let transactionsData: TransaccionResponse[] = [];

      switch (filter) {
        case 'all':
          transactionsData = await getAllTransactions();
          break;
        case 'client':
          if (userProfile.role === 'CLIENTE') {
            transactionsData = await getTransactionsByClient(userProfile.id);
          }
          break;
        case 'agent':
          if (userProfile.role === 'AGENTE') {
            transactionsData = await getTransactionsByAgent(userProfile.id);
          }
          break;
        case 'my':
          if (userProfile.role === 'CLIENTE') {
            transactionsData = await getTransactionsByClient(userProfile.id);
          } else if (userProfile.role === 'AGENTE') {
            transactionsData = await getTransactionsByAgent(userProfile.id);
          }
          break;
      }

      setTransactions(transactionsData);
      
      if (isRefresh) {
        showSuccess('Transacciones actualizadas');
      }
    } catch (error) {
      const message = 'No se pudieron cargar las transacciones';
      showError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoney = (amount: number) => {
    return `$${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  const getTransactionIcon = (tipo: TipoTransaccion) => {
    return tipo === 'VENTA' ? 'home' : 'key';
  };

  const getTransactionColor = (tipo: TipoTransaccion) => {
    return tipo === 'VENTA' ? colors.success : colors.info;
  };

  const getStatusColor = (tipo: TipoTransaccion) => {
    return tipo === 'VENTA' ? colors.successLight : colors.infoLight;
  };

  const renderTransaction = ({ item }: { item: TransaccionResponse }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.transactionInfo}>
          <View style={[styles.iconContainer, { backgroundColor: getStatusColor(item.tipo) }]}>
            <Ionicons 
              name={getTransactionIcon(item.tipo)} 
              size={20} 
              color={getTransactionColor(item.tipo)} 
            />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionId}>Transacción #{item.id}</Text>
            <View style={[styles.typeBadge, { backgroundColor: getTransactionColor(item.tipo) }]}>
              <Text style={styles.typeText}>{item.tipo}</Text>
            </View>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatMoney(item.monto)}</Text>
          <Text style={styles.dateText}>{formatDate(item.fecha)}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Propiedad</Text>
            <Text style={styles.infoValue}>#{item.propiedadId}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>#{item.clienteId}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Agente</Text>
            <Text style={styles.infoValue}>#{item.agenteId}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={14} color={colors.warning} />
            <Text style={styles.infoLabel}>Comisión</Text>
            <Text style={[styles.infoValue, styles.commissionValue]}>
              {formatMoney(item.comisionAgente)}
            </Text>
          </View>
        </View>

        {item.detalles && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsLabel}>Detalles</Text>
            <Text style={styles.detailsText} numberOfLines={2}>
              {item.detalles}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Filtrar transacciones</Text>
      <View style={styles.filterChips}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'my' && styles.filterChipActive]}
          onPress={() => setFilter('my')}
        >
          <Text style={[styles.filterChipText, filter === 'my' && styles.filterChipTextActive]}>
            Mis Transacciones
          </Text>
        </TouchableOpacity>

        {currentUser?.role === 'CLIENTE' && (
          <TouchableOpacity
            style={[styles.filterChip, filter === 'client' && styles.filterChipActive]}
            onPress={() => setFilter('client')}
          >
            <Text style={[styles.filterChipText, filter === 'client' && styles.filterChipTextActive]}>
              Como Cliente
            </Text>
          </TouchableOpacity>
        )}

        {currentUser?.role === 'AGENTE' && (
          <TouchableOpacity
            style={[styles.filterChip, filter === 'agent' && styles.filterChipActive]}
            onPress={() => setFilter('agent')}
          >
            <Text style={[styles.filterChipText, filter === 'agent' && styles.filterChipTextActive]}>
              Como Agente
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="receipt-outline" size={80} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No hay transacciones' : 'No tienes transacciones'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'No se encontraron transacciones en el sistema. Crea la primera transacción para comenzar.'
          : 'No tienes transacciones con el filtro seleccionado. Cambia el filtro o crea una nueva transacción.'
        }
      </Text>
      {(currentUser?.role === 'AGENTE' || currentUser?.role === 'ADMIN') && (
        <CustomButton
          title="Nueva Transacción"
          onPress={() => navigation.navigate('TransactionForm' as never)}
          variant="primary"
          size="medium"
          style={styles.emptyButton}
        />
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando transacciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Transacciones</Text>
          <Text style={styles.subtitle}>
            {transactions.length} transacción{transactions.length !== 1 ? 'es' : ''}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          {(currentUser?.role === 'AGENTE' || currentUser?.role === 'ADMIN') && (
            <CustomButton
              title="Reportes"
              onPress={() => navigation.navigate('TransactionReports')}
              variant="outline"
              size="small"
              style={styles.reportsButton}
            />
          )}
          <CustomButton
            title="Nueva"
            onPress={() => navigation.navigate('TransactionForm' as never)}
            variant="primary"
            size="small"
          />
        </View>
      </View>

      {renderFilters()}

      {transactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransaction}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadUserAndTransactions(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="Actualizando..."
              titleColor={colors.textSecondary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Header
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reportsButton: {
    flex: 1,
  },
  
  // Filters
  filtersContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.textPrimary,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // List
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  
  // Transaction Card
  transactionCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  
  // Card Content
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    marginRight: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  commissionValue: {
    color: colors.warning,
  },
  
  // Details
  detailsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  detailsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  
  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    minWidth: 200,
  },
});
