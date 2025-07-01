import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  Linking
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getVisitById, deleteVisit, confirmVisitAttendance } from '../api/visits';
import CustomButton from '../components/CustomButton';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';

// Tipos para los parámetros de la ruta
type ReservationDetailRouteProp = RouteProp<{ ReservationDetail: { id: number } }, 'ReservationDetail'>;
type ReservationDetailNavigationProp = StackNavigationProp<{ 
  EditReservation: { id: number };
  [key: string]: any;
}>;

// Tipo para la reserva
interface Reserva {
  id: number;
  propiedadId: string;
  clienteId: string;
  agenteId: string;
  fechaHora: string;
  estado: string;
  comentarios: string;
}

const ReservationDetailScreen = () => {
  const navigation = useNavigation<ReservationDetailNavigationProp>();
  const route = useRoute<ReservationDetailRouteProp>();
  const id = route.params.id;
  const { showError, showSuccess } = useToast();
  
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadReservationDetails();
  }, [id]);

  const loadReservationDetails = async () => {
    try {
      setLoading(true);
      const data = await getVisitById(String(id));
      setReserva(data);
    } catch (error) {
      showError('No se pudo cargar la información de la reserva');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    try {
      setActionLoading(true);
      await deleteVisit(String(id));
      showSuccess('Reserva eliminada exitosamente');
      navigation.goBack();
    } catch {
      showError('No se pudo eliminar la reserva');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleConfirmar = async () => {
    try {
      setActionLoading(true);
      await confirmVisitAttendance(String(id));
      showSuccess('Asistencia confirmada exitosamente');
      // Reload the reservation to update status
      await loadReservationDetails();
    } catch {
      showError('No se pudo confirmar la asistencia');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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
      case 'completada':
      case 'completed':
        return colors.primary;
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
      case 'completada':
      case 'completed':
        return 'checkmark-done-circle';
      default:
        return 'help-circle';
    }
  };

  const handleCallProperty = () => {
    // Simulated phone number - in real app, get from property data
    const phoneNumber = '+541234567890';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleGetDirections = () => {
    // Simulated address - in real app, get from property data
    const address = 'Av. Corrientes 1234, Buenos Aires';
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIcon}>
        <Ionicons name="calendar" size={48} color={colors.primary} />
      </View>
      <Text style={styles.loadingText}>Cargando detalles...</Text>
    </View>
  );

  const renderNotFoundState = () => (
    <View style={styles.notFoundContainer}>
      <View style={styles.notFoundIcon}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      </View>
      <Text style={styles.notFoundTitle}>Reserva no encontrada</Text>
      <Text style={styles.notFoundSubtitle}>
        La reserva que buscas no existe o fue eliminada
      </Text>
      <CustomButton
        title="Volver"
        onPress={() => navigation.goBack()}
        variant="outline"
        style={styles.backToListButton}
      />
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

  if (!reserva) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        {renderNotFoundState()}
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
        <Text style={styles.headerTitle}>Detalles de Reserva</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadReservationDetails}
        >
          <Ionicons name="refresh" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor(reserva.estado) + '20' }]}>
              <Ionicons 
                name={getStatusIcon(reserva.estado) as any} 
                size={24} 
                color={getStatusColor(reserva.estado)} 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.reservationId}>Reserva #{reserva.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reserva.estado) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(reserva.estado) }]}>
                  {reserva.estado}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Property Information */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Información de la Propiedad</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID de Propiedad:</Text>
            <Text style={styles.infoValue}>{reserva.propiedadId}</Text>
          </View>
          
          <View style={styles.actionRow}>
            <CustomButton
              title="Llamar"
              onPress={handleCallProperty}
              variant="outline"
              size="small"
              leftIcon="call"
              style={styles.actionButton}
            />
            <CustomButton
              title="Direcciones"
              onPress={handleGetDirections}
              variant="outline"
              size="small"
              leftIcon="location"
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Visit Details */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Detalles de la Visita</Text>
          </View>
          
          <View style={styles.visitDetails}>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeItem}>
                <View style={styles.dateTimeIcon}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.dateTimeLabel}>Fecha</Text>
                  <Text style={styles.dateTimeValue}>{formatDate(reserva.fechaHora)}</Text>
                </View>
              </View>
              
              <View style={styles.dateTimeItem}>
                <View style={styles.dateTimeIcon}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.dateTimeLabel}>Hora</Text>
                  <Text style={styles.dateTimeValue}>{formatTime(reserva.fechaHora)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Participantes</Text>
          </View>
          
          <View style={styles.participantRow}>
            <View style={styles.participantInfo}>
              <Ionicons name="person" size={16} color={colors.textSecondary} />
              <Text style={styles.participantLabel}>Cliente:</Text>
            </View>
            <Text style={styles.participantValue}>{reserva.clienteId}</Text>
          </View>
          
          <View style={styles.participantRow}>
            <View style={styles.participantInfo}>
              <Ionicons name="business" size={16} color={colors.textSecondary} />
              <Text style={styles.participantLabel}>Agente:</Text>
            </View>
            <Text style={styles.participantValue}>{reserva.agenteId}</Text>
          </View>
        </View>

        {/* Comments */}
        {reserva.comentarios && (
          <View style={styles.commentsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="chatbubble" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Comentarios</Text>
            </View>
            <Text style={styles.commentsText}>{reserva.comentarios}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Acciones</Text>
          </View>
          
          <View style={styles.actionButtons}>
            <CustomButton
              title="Editar Reserva"
              onPress={() => navigation.navigate('EditReservation', { id: reserva.id })}
              variant="outline"
              leftIcon="create"
              style={styles.actionButtonFull}
            />
            
            {reserva.estado.toLowerCase() === 'confirmada' && (
              <CustomButton
                title={actionLoading ? "Confirmando..." : "Confirmar Asistencia"}
                onPress={handleConfirmar}
                variant="primary"
                leftIcon={actionLoading ? undefined : "checkmark-circle"}
                disabled={actionLoading}
                style={styles.actionButtonFull}
              />
            )}
            
            <CustomButton
              title="Eliminar Reserva"
              onPress={() => setShowDeleteModal(true)}
              variant="error"
              leftIcon="trash"
              style={styles.actionButtonFull}
            />
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="warning" size={32} color={colors.error} />
              </View>
              <Text style={styles.modalTitle}>Eliminar Reserva</Text>
              <Text style={styles.modalSubtitle}>
                ¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <CustomButton
                title="Cancelar"
                onPress={() => setShowDeleteModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title={actionLoading ? "Eliminando..." : "Eliminar"}
                onPress={handleEliminar}
                variant="error"
                disabled={actionLoading}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  reservationId: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  infoCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  visitDetails: {
    marginTop: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
  },
  dateTimeIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  participantValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  commentsCard: {
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
  commentsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  actionsCard: {
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
  actionButtons: {
    gap: 12,
  },
  actionButtonFull: {
    width: '100%',
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
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  notFoundIcon: {
    width: 80,
    height: 80,
    backgroundColor: colors.errorLight,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  notFoundSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backToListButton: {
    alignSelf: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.errorLight,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default ReservationDetailScreen;