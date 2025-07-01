import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getVerificationRequestsByUser, 
  updateVerificationRequestStatus, 
  SolicitudVerificacionResponse, 
  EstadoSolicitud 
} from '../api/verificationRequests';
import { getUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';

export default function AdminVerificationScreen() {
  const { showError, showSuccess } = useToast();
  
  const [solicitudes, setSolicitudes] = useState<SolicitudVerificacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SolicitudVerificacionResponse | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [adminId, setAdminId] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'>('PENDIENTE');

  const filterOptions = [
    { key: 'PENDIENTE', label: 'Pendientes', icon: 'time', count: 0 },
    { key: 'APROBADA', label: 'Aprobadas', icon: 'checkmark-circle', count: 0 },
    { key: 'RECHAZADA', label: 'Rechazadas', icon: 'close-circle', count: 0 },
    { key: 'ALL', label: 'Todas', icon: 'list', count: 0 },
  ];

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile();
      setAdminId(userProfile.id);
      
      const requests = await getVerificationRequestsByUser(userProfile.id);
      setSolicitudes(requests);
    } catch (error) {
      showError('No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (request: SolicitudVerificacionResponse, newStatus: EstadoSolicitud) => {
    setSelectedRequest(request);
    if (newStatus === 'RECHAZADA') {
      setModalVisible(true);
    } else {
      await updateStatus(request.id, newStatus, '');
    }
  };

  const updateStatus = async (requestId: number, status: EstadoSolicitud, comments: string) => {
    try {
      setActionLoading(true);
      await updateVerificationRequestStatus(requestId, status, adminId, comments);
      
      const statusText = status === 'APROBADA' ? 'aprobada' : 'rechazada';
      showSuccess(`Solicitud ${statusText} exitosamente`);
      
      setModalVisible(false);
      setAdminComments('');
      await loadAdminData();
    } catch (error) {
      showError('No se pudo actualizar el estado de la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'PENDIENTE':
        return colors.warning;
      case 'APROBADA':
        return colors.success;
      case 'RECHAZADA':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (estado: EstadoSolicitud) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'time';
      case 'APROBADA':
        return 'checkmark-circle';
      case 'RECHAZADA':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const openDocument = (documentUrl: string) => {
    if (documentUrl.startsWith('http')) {
      Linking.openURL(documentUrl);
    } else {
      showError('Documento no disponible para visualización');
    }
  };

  const getFilteredSolicitudes = () => {
    if (filter === 'ALL') return solicitudes;
    return solicitudes.filter(s => s.estado === filter);
  };

  const getFilterCounts = () => {
    const counts = {
      PENDIENTE: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
      APROBADA: solicitudes.filter(s => s.estado === 'APROBADA').length,
      RECHAZADA: solicitudes.filter(s => s.estado === 'RECHAZADA').length,
      ALL: solicitudes.length,
    };
    return counts;
  };

  const renderFilterChip = (option: any) => {
    const counts = getFilterCounts();
    const count = counts[option.key as keyof typeof counts];
    const isActive = filter === option.key;

    return (
      <TouchableOpacity
        key={option.key}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setFilter(option.key)}
      >
        <Ionicons 
          name={option.icon as any} 
          size={16} 
          color={isActive ? colors.background : colors.textSecondary} 
        />
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {option.label}
        </Text>
        <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
          <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: SolicitudVerificacionResponse }) => (
    <View style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.requestInfo}>
          <View style={styles.requestIcon}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
          </View>
          <View style={styles.requestDetails}>
            <Text style={styles.requestId}>Solicitud #{item.id}</Text>
            <Text style={styles.requestDate}>Usuario ID: {item.usuarioId}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(item.estado) as any} 
            size={14} 
            color={getStatusColor(item.estado)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
            {item.estado}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Fecha:</Text>
            <Text style={styles.infoValue}>{formatDate(item.fechaSolicitud)}</Text>
          </View>
        </View>

        {item.comentarios && (
          <View style={styles.commentsContainer}>
            <View style={styles.commentsHeader}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.commentsLabel}>Comentarios del usuario:</Text>
            </View>
            <Text style={styles.commentsText}>{item.comentarios}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.documentButton}
          onPress={() => openDocument(item.documentoAdjunto)}
        >
          <Ionicons name="document-attach" size={16} color={colors.primary} />
          <Text style={styles.documentText}>Ver documento adjunto</Text>
          <Ionicons name="open-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {item.estado === 'PENDIENTE' && (
        <View style={styles.actionButtons}>
          <CustomButton
            title="Aprobar"
            onPress={() => handleStatusUpdate(item, 'APROBADA')}
            variant="success"
            size="small"
            leftIcon="checkmark-circle"
            style={styles.actionButton}
          />
          
          <CustomButton
            title="Rechazar"
            onPress={() => handleStatusUpdate(item, 'RECHAZADA')}
            variant="error"
            size="small"
            leftIcon="close-circle"
            style={styles.actionButton}
          />
        </View>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIcon}>
        <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
      </View>
      <Text style={styles.loadingText}>Cargando solicitudes...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No hay solicitudes</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'PENDIENTE' 
          ? 'No hay solicitudes pendientes de revisión'
          : `No hay solicitudes ${filter.toLowerCase()}`
        }
      </Text>
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
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Verificaciones</Text>
            <Text style={styles.headerSubtitle}>Gestión de solicitudes</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtrar por estado</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {filterOptions.map(renderFilterChip)}
          </ScrollView>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={20} color={colors.warning} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{getFilterCounts().PENDIENTE}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{getFilterCounts().APROBADA}</Text>
              <Text style={styles.statLabel}>Aprobadas</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{getFilterCounts().RECHAZADA}</Text>
              <Text style={styles.statLabel}>Rechazadas</Text>
            </View>
          </View>
        </View>

        {/* Requests List */}
        <View style={styles.requestsContainer}>
          {getFilteredSolicitudes().length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={getFilteredSolicitudes()}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalWarning}>
              <View style={styles.warningIcon}>
                <Ionicons name="warning" size={24} color={colors.error} />
              </View>
              <Text style={styles.warningText}>
                Estás a punto de rechazar la solicitud #{selectedRequest?.id}
              </Text>
            </View>

            <InputField
              label="Motivo del rechazo"
              placeholder="Describe el motivo por el cual se rechaza la solicitud..."
              value={adminComments}
              onChangeText={setAdminComments}
              multiline
              numberOfLines={4}
              leftIcon="chatbubble-outline"
              required
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancelar"
                onPress={() => setModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
              />
              
              <CustomButton
                title={actionLoading ? "Rechazando..." : "Rechazar Solicitud"}
                onPress={() => selectedRequest && updateStatus(selectedRequest.id, 'RECHAZADA', adminComments)}
                variant="error"
                disabled={actionLoading || !adminComments.trim()}
                style={styles.modalButton}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    padding: 20,
    paddingBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  filtersScroll: {
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.background,
  },
  filterCount: {
    backgroundColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: colors.background,
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterCountTextActive: {
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  requestsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  requestCard: {
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
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  requestIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDetails: {
    flex: 1,
  },
  requestId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  requestDate: {
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
  infoRow: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  commentsContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    marginBottom: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  commentsText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  documentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  separator: {
    height: 16,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  warningIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.background,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
  },
});
