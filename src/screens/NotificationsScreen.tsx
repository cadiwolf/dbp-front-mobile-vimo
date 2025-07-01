import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { useToast } from '../components/ToastProvider';
import CustomButton from '../components/CustomButton';

// Mock notification data structure
interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'property' | 'transaction' | 'visit';
  timestamp: string;
  read: boolean;
  actionType?: 'navigate' | 'approve' | 'reject';
  actionData?: any;
}

// Mock API functions
const getNotifications = async (): Promise<Notification[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    {
      id: 1,
      title: 'Nueva solicitud de visita',
      message: 'Juan Pérez ha solicitado una visita para el apartamento en Zona Rosa el 15 de enero a las 3:00 PM.',
      type: 'visit',
      timestamp: '2025-01-10T15:30:00Z',
      read: false,
      actionType: 'navigate',
      actionData: { screen: 'VisitDetail', params: { id: 1 } }
    },
    {
      id: 2,
      title: 'Transacción completada',
      message: 'La venta de la propiedad en Chapinero se ha completado exitosamente. Comisión: $2,500,000.',
      type: 'transaction',
      timestamp: '2025-01-10T14:15:00Z',
      read: false,
      actionType: 'navigate',
      actionData: { screen: 'TransactionDetail', params: { id: 5 } }
    },
    {
      id: 3,
      title: 'Propiedad aprobada',
      message: 'Tu propiedad "Casa en La Candelaria" ha sido aprobada y ahora está visible en el sistema.',
      type: 'success',
      timestamp: '2025-01-10T12:00:00Z',
      read: true
    },
    {
      id: 4,
      title: 'Recordatorio de cita',
      message: 'Tienes una visita programada mañana a las 10:00 AM en el edificio Torre Central.',
      type: 'warning',
      timestamp: '2025-01-09T18:00:00Z',
      read: true
    },
    {
      id: 5,
      title: 'Nuevo mensaje',
      message: 'María García te ha enviado un mensaje sobre la propiedad en Zona Norte.',
      type: 'info',
      timestamp: '2025-01-09T16:45:00Z',
      read: true
    },
    {
      id: 6,
      title: 'Error en documento',
      message: 'Se encontró un error en los documentos de la propiedad ID: 123. Por favor revisa.',
      type: 'error',
      timestamp: '2025-01-09T11:30:00Z',
      read: true
    }
  ];
};

const markAsRead = async (notificationId: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
};

const markAllAsRead = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
};

const deleteNotification = async (notificationId: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
};

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { showSuccess, showError } = useToast();

  const loadNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getNotifications();
      setNotifications(data);
      
      if (isRefresh) {
        showSuccess('Notificaciones actualizadas');
      }
    } catch (error) {
      showError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showSuccess, showError]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace unos minutos';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'visit':
        return 'calendar-outline';
      case 'transaction':
        return 'card-outline';
      case 'property':
        return 'home-outline';
      case 'success':
        return 'checkmark-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'error':
        return 'alert-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'visit':
        return colors.info;
      case 'transaction':
        return colors.success;
      case 'property':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getNotificationBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'visit':
        return colors.infoLight;
      case 'transaction':
        return colors.successLight;
      case 'property':
        return colors.primaryLight;
      case 'success':
        return colors.successLight;
      case 'warning':
        return colors.warningLight;
      case 'error':
        return colors.errorLight;
      default:
        return colors.backgroundSecondary;
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        showError('Error al marcar como leída');
      }
    }

    if (notification.actionType === 'navigate' && notification.actionData) {
      navigation.navigate(notification.actionData.screen, notification.actionData.params);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showSuccess('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      showError('Error al marcar todas como leídas');
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    Alert.alert(
      'Eliminar notificación',
      '¿Estás seguro de que deseas eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(notificationId);
              setNotifications(prev => prev.filter(n => n.id !== notificationId));
              showSuccess('Notificación eliminada');
            } catch (error) {
              showError('Error al eliminar notificación');
            }
          }
        }
      ]
    );
  };

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.notificationHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getNotificationBgColor(item.type) }]}>
            <Ionicons 
              name={getNotificationIcon(item.type)} 
              size={20} 
              color={getNotificationColor(item.type)} 
            />
          </View>
          
          <View style={styles.notificationInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.notificationMessage} numberOfLines={3}>
          {item.message}
        </Text>
        
        {item.actionType && (
          <View style={styles.actionIndicator}>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            <Text style={styles.actionText}>Tocar para ver detalles</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons 
          name={filter === 'unread' ? 'checkmark-done-circle-outline' : 'notifications-off-outline'} 
          size={80} 
          color={colors.textTertiary} 
        />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'unread' ? '¡Todo al día!' : 'No hay notificaciones'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'unread' 
          ? 'No tienes notificaciones sin leer. Mantente atento a nuevas actualizaciones.'
          : 'Cuando recibas notificaciones aparecerán aquí. Te mantendremos informado sobre actividades importantes.'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando notificaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Notificaciones</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 
              ? `${unreadCount} sin leer de ${notifications.length} total${notifications.length !== 1 ? 'es' : ''}`
              : `${notifications.length} notificación${notifications.length !== 1 ? 'es' : ''}`
            }
          </Text>
        </View>
        
        {unreadCount > 0 && (
          <CustomButton
            title="Marcar todas"
            onPress={handleMarkAllAsRead}
            variant="outline"
            size="small"
            style={styles.markAllButton}
          />
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            Todas ({notifications.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterChipText, filter === 'unread' && styles.filterChipTextActive]}>
            Sin leer ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerContent: {
    flex: 1,
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
  markAllButton: {
    marginLeft: 12,
  },
  
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
  
  // Notification Card
  notificationCard: {
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
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
  },
  unreadCard: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.backgroundSecondary,
  },
  cardContent: {
    padding: 20,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
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
  },
});
