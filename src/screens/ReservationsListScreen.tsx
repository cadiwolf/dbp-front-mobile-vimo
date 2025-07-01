import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getVisitsByClient, getVisitsByAgent } from '../api/visits';
import { colors } from '../styles/colors';
import { useToast } from '../components/ToastProvider';

// Tipos para los parámetros de la ruta
type ReservationsListRouteProp = RouteProp<{ ReservationsList: { userId: number; userRole?: string } }, 'ReservationsList'>;
type ReservationsListNavigationProp = StackNavigationProp<{ 
  ReservationDetail: { id: number };
  [key: string]: any;
}>;

// Tipo para las reservas
interface Reserva {
  id: number;
  propiedadId: string;
  clienteId: string;
  agenteId: string;
  fechaHora: string;
  estado: string;
  comentarios: string;
}

const ReservationsListScreen = () => {
  const navigation = useNavigation<ReservationsListNavigationProp>();
  const route = useRoute<ReservationsListRouteProp>();
  const { userId, userRole } = route.params;
  const { showError } = useToast();
  
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReservas();
  }, [userId, userRole]);

  const fetchReservas = async () => {
    try {
      setLoading(true);
      let data;
      if (userRole === 'AGENTE') {
        data = await getVisitsByAgent(String(userId));
      } else {
        data = await getVisitsByClient(String(userId));
      }
      setReservas(data);
    } catch (e) {
      showError('No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservas();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'confirmada':
      case 'confirmed':
        return colors.success;
      case 'pendiente':
      case 'pending':
        return colors.warning;
      case 'cancelada':
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'confirmada':
      case 'confirmed':
        return 'checkmark-circle';
      case 'pendiente':
      case 'pending':
        return 'time';
      case 'cancelada':
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderReservationItem = ({ item }: { item: Reserva }) => (
    <TouchableOpacity
      style={styles.reservationCard}
      onPress={() => navigation.navigate('ReservationDetail', { id: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.propertyInfo}>
          <View style={styles.propertyIcon}>
            <Ionicons name="home" size={20} color={colors.primary} />
          </View>
          <View style={styles.propertyDetails}>
            <Text style={styles.reservationTitle}>Reserva #{item.id}</Text>
            <Text style={styles.propertyId}>Propiedad: {item.propiedadId}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(item.estado) as any} 
            size={16} 
            color={getStatusColor(item.estado)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
            {item.estado}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateTimeText}>{formatDate(item.fechaHora)}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateTimeText}>{formatTime(item.fechaHora)}</Text>
          </View>
        </View>

        {item.comentarios && (
          <View style={styles.commentsContainer}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.commentsText} numberOfLines={2}>
              {item.comentarios}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>Ver detalles</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No hay reservas</Text>
      <Text style={styles.emptySubtitle}>
        {userRole === 'AGENTE' 
          ? 'Aún no tienes visitas programadas como agente'
          : 'No has programado ninguna visita aún'
        }
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIcon}>
        <Ionicons name="calendar" size={48} color={colors.primary} />
      </View>
      <Text style={styles.loadingText}>Cargando reservas...</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Mis Reservas</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={reservas}
        keyExtractor={item => item.id.toString()}
        renderItem={renderReservationItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  reservationCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyDetails: {
    flex: 1,
  },
  reservationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  propertyId: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  cardContent: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  commentsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  commentsText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  separator: {
    height: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.primaryLight,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default ReservationsListScreen;