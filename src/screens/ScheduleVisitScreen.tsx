import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { scheduleVisit } from '../api/visits';
import { getPropertyById, PropertyResponse } from '../api/properties';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';

// Tipos de navegación
type ScheduleVisitRouteProp = RouteProp<{ ScheduleVisit: { propertyId: number } }, 'ScheduleVisit'>;
type ScheduleVisitNavigationProp = StackNavigationProp<any>;

export default function ScheduleVisitScreen() {
  const navigation = useNavigation<ScheduleVisitNavigationProp>();
  const route = useRoute<ScheduleVisitRouteProp>();
  const { propertyId } = route.params;
  const { showError, showSuccess } = useToast();

  const [property, setProperty] = useState<PropertyResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<'morning' | 'afternoon' | 'evening' | null>(null);

  const timeSlots = [
    { id: 'morning', label: 'Mañana', icon: 'sunny', time: '09:00 - 12:00' },
    { id: 'afternoon', label: 'Tarde', icon: 'partly-sunny', time: '14:00 - 17:00' },
    { id: 'evening', label: 'Noche', icon: 'moon', time: '18:00 - 20:00' },
  ];

  const availableHours = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  useEffect(() => {
    loadPropertyData();
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
  }, []);

  const loadPropertyData = async () => {
    try {
      setLoadingProperty(true);
      const propertyData = await getPropertyById(propertyId);
      setProperty(propertyData);
    } catch (error) {
      showError('No se pudo cargar la información de la propiedad');
      navigation.goBack();
    } finally {
      setLoadingProperty(false);
    }
  };

  const onDateChange = (selectedDateString: string) => {
    const newDate = new Date(selectedDateString);
    setSelectedDate(newDate);
    setShowDateModal(false);
  };

  const onTimeChange = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const newTime = new Date();
    newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    setSelectedTime(newTime);
    setShowTimeModal(false);
  };

  const validateVisit = () => {
    const now = new Date();
    const visitDateTime = new Date(selectedDate);
    visitDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

    // Check if date is in the past
    if (visitDateTime <= now) {
      showError('La fecha y hora deben ser futuras');
      return false;
    }

    // Check if it's too soon (less than 2 hours from now)
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (visitDateTime < twoHoursFromNow) {
      showError('La visita debe programarse con al menos 2 horas de anticipación');
      return false;
    }

    // Check if it's a weekend
    const dayOfWeek = visitDateTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      Alert.alert(
        'Fin de semana',
        'Has seleccionado un fin de semana. ¿Estás seguro de que quieres continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => handleSchedule() }
        ]
      );
      return false;
    }

    return true;
  };

  const handleSchedule = async () => {
    if (!validateVisit()) return;

    setLoading(true);
    try {
      const visitDateTime = new Date(selectedDate);
      visitDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      
      const formattedDateTime = visitDateTime.toISOString();
      
      await scheduleVisit(propertyId.toString(), formattedDateTime, message);
      
      showSuccess('Visita agendada exitosamente');
      
      // Show confirmation with details
      Alert.alert(
        '¡Visita confirmada!',
        `Tu visita ha sido agendada para ${formatDate(visitDateTime)} a las ${formatTime(visitDateTime)}.\n\nRecibirás un correo con los detalles y un código QR.`,
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      showError('No se pudo agendar la visita. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMinimumDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const handleTimeSlotSelect = (slot: 'morning' | 'afternoon' | 'evening') => {
    setPreferredTimeSlot(slot);
    const newTime = new Date();
    
    switch (slot) {
      case 'morning':
        newTime.setHours(10, 0, 0, 0);
        break;
      case 'afternoon':
        newTime.setHours(15, 0, 0, 0);
        break;
      case 'evening':
        newTime.setHours(18, 30, 0, 0);
        break;
    }
    
    setSelectedTime(newTime);
  };

  if (loadingProperty) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="home" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
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
        <Text style={styles.headerTitle}>Agendar Visita</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Property Card */}
        {property && (
          <View style={styles.propertyCard}>
            <View style={styles.propertyHeader}>
              <View style={styles.propertyIcon}>
                <Ionicons name="home" size={24} color={colors.primary} />
              </View>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle}>{property.titulo}</Text>
                <Text style={styles.propertyAddress}>{property.direccion}</Text>
                <Text style={styles.propertyPrice}>
                  {new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                  }).format(property.precio)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Visit Planning */}
        <View style={styles.planningCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Planificar mi visita</Text>
          </View>
          
          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fecha de la visita</Text>
            <TouchableOpacity
              style={styles.dateTimeSelector}
              onPress={() => setShowDateModal(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <View style={styles.selectorText}>
                  <Text style={styles.selectorLabel}>Fecha seleccionada</Text>
                  <Text style={styles.selectorValue}>{formatDate(selectedDate)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Time Slot Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horario preferido</Text>
            <View style={styles.timeSlots}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlot,
                    preferredTimeSlot === slot.id && styles.timeSlotActive
                  ]}
                  onPress={() => handleTimeSlotSelect(slot.id as any)}
                >
                  <Ionicons 
                    name={slot.icon as any} 
                    size={24} 
                    color={preferredTimeSlot === slot.id ? colors.background : colors.primary} 
                  />
                  <Text style={[
                    styles.timeSlotLabel,
                    preferredTimeSlot === slot.id && styles.timeSlotLabelActive
                  ]}>
                    {slot.label}
                  </Text>
                  <Text style={[
                    styles.timeSlotTime,
                    preferredTimeSlot === slot.id && styles.timeSlotTimeActive
                  ]}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Specific Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hora específica</Text>
            <TouchableOpacity
              style={styles.dateTimeSelector}
              onPress={() => setShowTimeModal(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <View style={styles.selectorText}>
                  <Text style={styles.selectorLabel}>Hora seleccionada</Text>
                  <Text style={styles.selectorValue}>{formatTime(selectedTime)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Message */}
          <View style={styles.section}>
            <InputField
              label="Mensaje adicional (opcional)"
              placeholder="Agrega comentarios especiales o consultas..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              leftIcon="chatbubble-outline"
            />
          </View>
        </View>

        {/* Visit Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.summaryTitle}>Resumen de la visita</Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fecha:</Text>
              <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hora:</Text>
              <Text style={styles.summaryValue}>{formatTime(selectedTime)}</Text>
            </View>
            
            {message && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mensaje:</Text>
                <Text style={styles.summaryValue}>{message}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <CustomButton
            title={loading ? "Agendando visita..." : "Confirmar visita"}
            onPress={handleSchedule}
            disabled={loading}
            variant="primary"
            size="large"
            leftIcon={loading ? undefined : "calendar"}
          />
          
          <CustomButton
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="large"
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>

      {/* Date Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDateModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Fecha</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {Array.from({ length: 14 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i + 1);
              const dateString = date.toISOString().split('T')[0];
              const isSelected = selectedDate.toISOString().split('T')[0] === dateString;
              
              return (
                <TouchableOpacity
                  key={dateString}
                  style={[styles.dateOption, isSelected && styles.dateOptionSelected]}
                  onPress={() => onDateChange(dateString)}
                >
                  <Text style={[styles.dateOptionText, isSelected && styles.dateOptionTextSelected]}>
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Time Modal */}
      <Modal
        visible={showTimeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTimeModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Hora</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {availableHours.map((hour) => {
              const isSelected = formatTime(selectedTime) === hour;
              
              return (
                <TouchableOpacity
                  key={hour}
                  style={[styles.timeOption, isSelected && styles.timeOptionSelected]}
                  onPress={() => onTimeChange(hour)}
                >
                  <Text style={[styles.timeOptionText, isSelected && styles.timeOptionTextSelected]}>
                    {hour}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  propertyCard: {
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
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  propertyIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.primaryLight,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  planningCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  dateTimeSelector: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorText: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  timeSlots: {
    flexDirection: 'row',
    gap: 12,
  },
  timeSlot: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    justifyContent: 'center',
  },
  timeSlotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSlotLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  timeSlotLabelActive: {
    color: colors.background,
  },
  timeSlotTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeSlotTimeActive: {
    color: colors.background,
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  actionContainer: {
    gap: 12,
  },
  cancelButton: {
    marginTop: 8,
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  dateOption: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dateOptionTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
  timeOption: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
});
