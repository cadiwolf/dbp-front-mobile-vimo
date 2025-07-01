import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { 
  getTransactionsByAgentAndMonth,
  getTransactionsByAgent,
  TransaccionResponse 
} from '../api/transactions';
import { getAllUsers } from '../api/users';
import { getUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';
import { RootStackParamList } from '../navigation/AppNavigator';

type TransactionReportsNavigationProp = StackNavigationProp<RootStackParamList>;

interface AgentReport {
  agentId: number;
  agentName: string;
  totalTransactions: number;
  totalAmount: number;
  totalCommission: number;
  ventasCount: number;
  alquileresCount: number;
}

export default function TransactionReportsScreen() {
  const navigation = useNavigation<TransactionReportsNavigationProp>();
  const { showError, showSuccess } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [agentReports, setAgentReports] = useState<AgentReport[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ventas' | 'alquileres'>('all');

  const months = [
    { number: 1, name: 'Ene', fullName: 'Enero' },
    { number: 2, name: 'Feb', fullName: 'Febrero' },
    { number: 3, name: 'Mar', fullName: 'Marzo' },
    { number: 4, name: 'Abr', fullName: 'Abril' },
    { number: 5, name: 'May', fullName: 'Mayo' },
    { number: 6, name: 'Jun', fullName: 'Junio' },
    { number: 7, name: 'Jul', fullName: 'Julio' },
    { number: 8, name: 'Ago', fullName: 'Agosto' },
    { number: 9, name: 'Sep', fullName: 'Septiembre' },
    { number: 10, name: 'Oct', fullName: 'Octubre' },
    { number: 11, name: 'Nov', fullName: 'Noviembre' },
    { number: 12, name: 'Dic', fullName: 'Diciembre' },
  ];

  const years = [2023, 2024, 2025, 2026];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (agents.length > 0) {
      loadReports();
    }
  }, [selectedYear, selectedMonth, agents]);

  const loadInitialData = async () => {
    try {
      const [usersData, userProfile] = await Promise.all([
        getAllUsers(),
        getUserProfile()
      ]);

      const agentsData = usersData.filter((user: any) => user.role === 'AGENTE');
      setAgents(agentsData);
      setCurrentUser(userProfile);
    } catch (error) {
      showError('No se pudieron cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const reports: AgentReport[] = [];

      // Si el usuario actual es un agente, solo mostrar sus datos
      const agentsToProcess = currentUser?.role === 'AGENTE' 
        ? agents.filter((agent: any) => agent.id === currentUser.id)
        : agents;

      for (const agent of agentsToProcess) {
        try {
          const transactions = await getTransactionsByAgentAndMonth(
            agent.id, 
            selectedYear, 
            selectedMonth
          );

          const totalAmount = transactions.reduce((sum, t) => sum + t.monto, 0);
          const totalCommission = transactions.reduce((sum, t) => sum + t.comisionAgente, 0);
          const ventasCount = transactions.filter(t => t.tipo === 'VENTA').length;
          const alquileresCount = transactions.filter(t => t.tipo === 'ALQUILER').length;

          reports.push({
            agentId: agent.id,
            agentName: `${agent.nombre} ${agent.apellido}`,
            totalTransactions: transactions.length,
            totalAmount,
            totalCommission,
            ventasCount,
            alquileresCount,
          });
        } catch (error) {
          console.log(`Error loading data for agent ${agent.id}:`, error);
          // Agregar reporte vacío para el agente
          reports.push({
            agentId: agent.id,
            agentName: `${agent.nombre} ${agent.apellido}`,
            totalTransactions: 0,
            totalAmount: 0,
            totalCommission: 0,
            ventasCount: 0,
            alquileresCount: 0,
          });
        }
      }

      setAgentReports(reports);
    } catch (error) {
      showError('No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
    showSuccess('Reportes actualizados');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalSummary = () => {
    const totalTransactions = agentReports.reduce((sum, r) => sum + r.totalTransactions, 0);
    const totalAmount = agentReports.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalCommission = agentReports.reduce((sum, r) => sum + r.totalCommission, 0);
    const totalVentas = agentReports.reduce((sum, r) => sum + r.ventasCount, 0);
    const totalAlquileres = agentReports.reduce((sum, r) => sum + r.alquileresCount, 0);
    return { totalTransactions, totalAmount, totalCommission, totalVentas, totalAlquileres };
  };

  const getSelectedMonthName = () => {
    return months.find(m => m.number === selectedMonth)?.fullName || '';
  };

  if (loading && agentReports.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const summary = getTotalSummary();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? colors.textTertiary : colors.primary} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Ionicons name="analytics" size={28} color={colors.primary} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Análisis de Rendimiento</Text>
              <Text style={styles.heroSubtitle}>
                {getSelectedMonthName()} {selectedYear}
              </Text>
            </View>
          </View>
        </View>

        {/* Filtros de período */}
        <View style={styles.filtersCard}>
          <Text style={styles.cardTitle}>Período de consulta</Text>
          
          {/* Selector de año */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Año</Text>
            <View style={styles.chipContainer}>
              {years.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.chip,
                    selectedYear === year && styles.chipActive
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedYear === year && styles.chipTextActive
                  ]}>
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selector de mes */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Mes</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthsScroll}
            >
              {months.map(month => (
                <TouchableOpacity
                  key={month.number}
                  style={[
                    styles.monthChip,
                    selectedMonth === month.number && styles.chipActive
                  ]}
                  onPress={() => setSelectedMonth(month.number)}
                >
                  <Text style={[
                    styles.chipText,
                    selectedMonth === month.number && styles.chipTextActive
                  ]}>
                    {month.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Resumen global */}
        {(currentUser?.role === 'ADMIN' && agentReports.length > 1) && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="stats-chart" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Resumen Global</Text>
            </View>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{summary.totalTransactions}</Text>
                <Text style={styles.summaryLabel}>Transacciones</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{summary.totalVentas}</Text>
                <Text style={styles.summaryLabel}>Ventas</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{summary.totalAlquileres}</Text>
                <Text style={styles.summaryLabel}>Alquileres</Text>
              </View>
            </View>

            <View style={styles.summaryFinancial}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Volumen total</Text>
                <Text style={styles.financialAmount}>{formatCurrency(summary.totalAmount)}</Text>
              </View>
              
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Comisiones totales</Text>
                <Text style={styles.financialCommission}>{formatCurrency(summary.totalCommission)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Reportes por agente */}
        <View style={styles.agentsSection}>
          <Text style={styles.sectionTitle}>
            {currentUser?.role === 'ADMIN' ? 'Rendimiento por agente' : 'Mi rendimiento'}
          </Text>
          
          {agentReports.map((report) => (
            <View key={report.agentId} style={styles.agentCard}>
              <View style={styles.agentHeader}>
                <View style={styles.agentInfo}>
                  <View style={styles.agentAvatar}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.agentDetails}>
                    <Text style={styles.agentName}>{report.agentName}</Text>
                    <Text style={styles.agentStatus}>
                      {report.totalTransactions > 0 ? 'Activo' : 'Sin actividad'}
                    </Text>
                  </View>
                </View>
                <View style={styles.agentBadge}>
                  <Text style={styles.agentBadgeText}>{report.totalTransactions}</Text>
                </View>
              </View>

              {report.totalTransactions > 0 ? (
                <>
                  <View style={styles.agentStats}>
                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Ionicons name="home" size={16} color={colors.success} />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statValue}>{report.ventasCount}</Text>
                        <Text style={styles.statLabel}>Ventas</Text>
                      </View>
                    </View>

                    <View style={styles.statItem}>
                      <View style={styles.statIcon}>
                        <Ionicons name="key" size={16} color={colors.info} />
                      </View>
                      <View style={styles.statContent}>
                        <Text style={styles.statValue}>{report.alquileresCount}</Text>
                        <Text style={styles.statLabel}>Alquileres</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.agentFinancials}>
                    <View style={styles.financialRow}>
                      <Text style={styles.financialRowLabel}>Volumen de ventas</Text>
                      <Text style={styles.financialRowValue}>{formatCurrency(report.totalAmount)}</Text>
                    </View>
                    
                    <View style={styles.financialRow}>
                      <Text style={styles.financialRowLabel}>Comisiones ganadas</Text>
                      <Text style={styles.financialRowCommission}>{formatCurrency(report.totalCommission)}</Text>
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="analytics-outline" size={32} color={colors.textTertiary} />
                  <Text style={styles.emptyStateText}>Sin transacciones este período</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {agentReports.length === 0 && !loading && (
          <View style={styles.noDataCard}>
            <View style={styles.noDataContent}>
              <Ionicons name="document-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.noDataTitle}>Sin datos disponibles</Text>
              <Text style={styles.noDataText}>
                No hay reportes para el período seleccionado
              </Text>
            </View>
          </View>
        )}

        {/* Acciones */}
        <View style={styles.actionContainer}>
          <CustomButton
            title="Actualizar reportes"
            onPress={handleRefresh}
            disabled={refreshing}
            variant="primary"
            size="large"
            leftIcon="refresh"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  filtersCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.textLight,
    fontWeight: '600',
  },
  monthsScroll: {
    paddingRight: 20,
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryFinancial: {
    gap: 12,
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  financialAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
  },
  financialCommission: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.warning,
  },
  agentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  agentCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  agentStatus: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  agentBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  agentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  agentStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  agentFinancials: {
    gap: 8,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  financialRowLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  financialRowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  financialRowCommission: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  noDataCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 40,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  noDataContent: {
    alignItems: 'center',
    gap: 16,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
});
