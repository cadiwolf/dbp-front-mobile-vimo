import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Share 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { getTransactionById, TransaccionResponse, deleteTransaction } from '../api/transactions';
import { getUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';

// Tipos de navegación
type TransactionDetailRouteProp = RouteProp<{ TransactionDetail: { id: number } }, 'TransactionDetail'>;
type TransactionDetailNavigationProp = StackNavigationProp<any>;

export default function TransactionDetailScreen() {
  const navigation = useNavigation<TransactionDetailNavigationProp>();
  const route = useRoute<TransactionDetailRouteProp>();
  const transactionId = route.params.id;

  const [transaction, setTransaction] = useState<TransaccionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadTransaction();
    loadCurrentUser();
  }, []);

  const loadTransaction = async () => {
    try {
      const data = await getTransactionById(transactionId);
      setTransaction(data);
    } catch (error) {
      showError('No se pudo cargar la transacción');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const userProfile = await getUserProfile();
      setCurrentUser(userProfile);
    } catch (error) {
      console.log('Error loading user profile:', error);
    }
  };

  const handleShare = async () => {
    if (!transaction) return;
    
    try {
      const shareContent = {
        title: `Transacción #${transaction.id}`,
        message: `Detalles de la transacción #${transaction.id}\n\nTipo: ${transaction.tipo}\nMonto: ${formatMoney(transaction.monto)}\nFecha: ${formatDate(transaction.fecha)}\n\nCompartido desde VIMO App`,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      showError('No se pudo compartir la transacción');
    }
  };

  const handleEdit = () => {
    navigation.navigate('TransactionForm', { 
      transaction,
      mode: 'edit'
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: confirmDelete 
        }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!transaction) return;

    try {
      await deleteTransaction(transaction.id);
      showSuccess('Transacción eliminada exitosamente');
      navigation.goBack();
    } catch (error) {
      showError('No se pudo eliminar la transacción');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMoney = (amount: number) => {
    return `$${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  const getTransactionIcon = () => {
    if (!transaction) return 'document-text-outline';
    return transaction.tipo === 'VENTA' ? 'home' : 'key';
  };

  const getTransactionColor = () => {
    if (!transaction) return colors.textSecondary;
    return transaction.tipo === 'VENTA' ? colors.success : colors.info;
  };

  const getTransactionBgColor = () => {
    if (!transaction) return colors.backgroundSecondary;
    return transaction.tipo === 'VENTA' ? colors.successLight : colors.infoLight;
  };

  const canModifyTransaction = () => {
    if (!currentUser || !transaction) return false;
    return currentUser.role === 'ADMIN' || currentUser.id === transaction.agenteId;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando transacción...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        </View>
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>No se pudo cargar la información de la transacción</Text>
        <CustomButton
          title="Volver"
          onPress={() => navigation.goBack()}
          variant="outline"
          size="medium"
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header flotante */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          
          {canModifyTransaction() && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Card de la transacción */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={[styles.heroIcon, { backgroundColor: getTransactionBgColor() }]}>
              <Ionicons 
                name={getTransactionIcon()} 
                size={32} 
                color={getTransactionColor()} 
              />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.transactionId}>Transacción #{transaction.id}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getTransactionColor() }]}>
                <Text style={styles.typeText}>{transaction.tipo}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.heroAmount}>
            <Text style={styles.amountLabel}>Monto Total</Text>
            <Text style={styles.amountValue}>{formatMoney(transaction.monto)}</Text>
            <Text style={styles.dateText}>{formatDate(transaction.fecha)}</Text>
          </View>
        </View>

        {/* Información Financiera */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wallet-outline" size={20} color={colors.success} />
            <Text style={styles.sectionTitle}>Información Financiera</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Monto Transacción</Text>
              <Text style={styles.infoValue}>{formatMoney(transaction.monto)}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Comisión Agente</Text>
              <Text style={[styles.infoValue, styles.commissionValue]}>
                {formatMoney(transaction.comisionAgente)}
              </Text>
            </View>
            
            <View style={[styles.infoItem, styles.totalItem]}>
              <Text style={styles.totalLabel}>Total General</Text>
              <Text style={styles.totalValue}>
                {formatMoney(transaction.monto + transaction.comisionAgente)}
              </Text>
            </View>
          </View>
        </View>

        {/* Información de la Propiedad */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="home-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Propiedad</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.propertyCard}
            onPress={() => navigation.navigate('PropertyDetail', { id: transaction.propiedadId })}
            activeOpacity={0.8}
          >
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyId}>ID: #{transaction.propiedadId}</Text>
              {transaction.propiedad && (
                <>
                  <Text style={styles.propertyTitle} numberOfLines={2}>
                    {transaction.propiedad.titulo}
                  </Text>
                  <Text style={styles.propertyAddress} numberOfLines={1}>
                    {transaction.propiedad.direccion}
                  </Text>
                  <Text style={styles.propertyPrice}>
                    {formatMoney(transaction.propiedad.precio)}
                  </Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Información del Cliente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.info} />
            <Text style={styles.sectionTitle}>Cliente</Text>
          </View>
          
          <View style={styles.personCard}>
            <View style={styles.personAvatar}>
              <Ionicons name="person" size={24} color={colors.info} />
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personId}>ID: #{transaction.clienteId}</Text>
              {transaction.cliente && (
                <>
                  <Text style={styles.personName}>
                    {transaction.cliente.nombre} {transaction.cliente.apellido}
                  </Text>
                  <Text style={styles.personEmail}>{transaction.cliente.email}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Información del Agente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="briefcase-outline" size={20} color={colors.warning} />
            <Text style={styles.sectionTitle}>Agente</Text>
          </View>
          
          <View style={styles.personCard}>
            <View style={[styles.personAvatar, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="briefcase" size={24} color={colors.warning} />
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personId}>ID: #{transaction.agenteId}</Text>
              {transaction.agente && (
                <>
                  <Text style={styles.personName}>
                    {transaction.agente.nombre} {transaction.agente.apellido}
                  </Text>
                  <Text style={styles.personEmail}>{transaction.agente.email}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Detalles Adicionales */}
        {transaction.detalles && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>Detalles Adicionales</Text>
            </View>
            
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsText}>{transaction.detalles}</Text>
            </View>
          </View>
        )}

        {/* Botones de Acción */}
        {canModifyTransaction() && (
          <View style={styles.actionButtons}>
            <CustomButton
              title="Editar Transacción"
              onPress={handleEdit}
              variant="outline"
              size="large"
              style={styles.editButton}
            />
            
            <CustomButton
              title="Eliminar Transacción"
              onPress={handleDelete}
              variant="error"
              size="large"
              style={styles.deleteButton}
            />
          </View>
        )}
        
        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Loading & Error States
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorButton: {
    minWidth: 150,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.background,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120, // Space for fixed header
    paddingBottom: 40,
  },

  // Hero Card
  heroCard: {
    backgroundColor: colors.background,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  typeText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 10,
  },

  // Info Grid
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
  },
  commissionValue: {
    color: colors.warning,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },

  // Property Card
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyId: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },

  // Person Card
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  personInfo: {
    flex: 1,
  },
  personId: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
    marginBottom: 4,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  personEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Details
  detailsContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  detailsText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },

  // Action Buttons
  actionButtons: {
    marginHorizontal: 20,
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    // Custom styles if needed
  },
  deleteButton: {
    // Custom styles if needed
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 40,
  },
});
