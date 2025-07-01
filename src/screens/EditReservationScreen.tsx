import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { getVisitById, updateVisit } from '../api/visits';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { useToast } from '../components/ToastProvider';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

// Tipos para los parámetros de la ruta
type EditReservationRouteProp = RouteProp<{ EditReservation: { id: number } }, 'EditReservation'>;
type EditReservationNavigationProp = StackNavigationProp<{ EditReservation: { id: number } }>;

interface FormData {
  propiedadId: string;
  clienteId: string;
  agenteId: string;
  fechaHora: string;
  estado: string;
  comentarios: string;
}

const { width } = Dimensions.get('window');

const estadosVisita = [
  { key: 'PENDIENTE', label: 'Pendiente', color: colors.warning, icon: '⏳' },
  { key: 'CONFIRMADA', label: 'Confirmada', color: colors.success, icon: '✅' },
  { key: 'COMPLETADA', label: 'Completada', color: colors.primary, icon: '🏁' },
  { key: 'CANCELADA', label: 'Cancelada', color: colors.error, icon: '❌' },
  { key: 'REPROGRAMADA', label: 'Reprogramada', color: colors.primaryLight, icon: '📅' },
];

const EditReservationScreen = () => {
  const navigation = useNavigation<EditReservationNavigationProp>();
  const route = useRoute<EditReservationRouteProp>();
  const { showSuccess, showError } = useToast();
  const id = route.params.id;
  
  const [form, setForm] = useState<FormData>({
    propiedadId: '',
    clienteId: '',
    agenteId: '',
    fechaHora: '',
    estado: 'PENDIENTE',
    comentarios: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadReservation = async () => {
      try {
        setLoading(true);
        const data = await getVisitById(String(id));
        setForm(data);
      } catch (error) {
        showError('No se pudo cargar la información de la reserva');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    loadReservation();
  }, [id, navigation, showError]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.propiedadId?.trim()) {
      newErrors.propiedadId = 'ID de propiedad es requerido';
    }

    if (!form.clienteId?.trim()) {
      newErrors.clienteId = 'ID de cliente es requerido';
    }

    if (!form.agenteId?.trim()) {
      newErrors.agenteId = 'ID de agente es requerido';
    }

    if (!form.fechaHora?.trim()) {
      newErrors.fechaHora = 'Fecha y hora son requeridas';
    } else {
      const fechaRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
      if (!fechaRegex.test(form.fechaHora)) {
        newErrors.fechaHora = 'Formato de fecha inválido (YYYY-MM-DDTHH:MM:SS)';
      }
    }

    if (!form.estado?.trim()) {
      newErrors.estado = 'Estado es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setSaving(true);
      await updateVisit(String(id), form);
      showSuccess('Reserva actualizada exitosamente');
      navigation.goBack();
    } catch (error) {
      showError('No se pudo actualizar la reserva');
    } finally {
      setSaving(false);
    }
  };

  const renderStatusSelector = () => (
    <View style={styles.statusSection}>
      <Text style={styles.sectionTitle}>Estado de la reserva</Text>
      <View style={styles.statusContainer}>
        {estadosVisita.map(estado => (
          <TouchableOpacity
            key={estado.key}
            style={[
              styles.statusChip,
              form.estado === estado.key && [styles.statusChipActive, { borderColor: estado.color }]
            ]}
            onPress={() => handleChange('estado', estado.key)}
          >
            <Text style={styles.statusIcon}>{estado.icon}</Text>
            <Text style={[
              styles.statusText,
              form.estado === estado.key && [styles.statusTextActive, { color: estado.color }]
            ]}>
              {estado.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.estado && <Text style={styles.errorText}>{errors.estado}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando información de la reserva...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Editar Reserva #{id}</Text>
        <Text style={styles.subtitle}>
          Modifica los detalles de la reserva de visita
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Información básica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información básica</Text>
          
          <InputField
            label="ID de Propiedad"
            value={form.propiedadId}
            onChangeText={(text: string) => handleChange('propiedadId', text)}
            placeholder="Ingresa el ID de la propiedad"
            keyboardType="numeric"
            error={errors.propiedadId}
            required
          />

          <InputField
            label="ID de Cliente"
            value={form.clienteId}
            onChangeText={(text: string) => handleChange('clienteId', text)}
            placeholder="Ingresa el ID del cliente"
            keyboardType="numeric"
            error={errors.clienteId}
            required
          />

          <InputField
            label="ID de Agente"
            value={form.agenteId}
            onChangeText={(text: string) => handleChange('agenteId', text)}
            placeholder="Ingresa el ID del agente"
            keyboardType="numeric"
            error={errors.agenteId}
            required
          />
        </View>

        {/* Programación */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programación</Text>
          
          <InputField
            label="Fecha y Hora"
            value={form.fechaHora}
            onChangeText={(text: string) => handleChange('fechaHora', text)}
            placeholder="YYYY-MM-DDTHH:MM:SS"
            error={errors.fechaHora}
            required
            helperText="Formato: 2024-12-31T14:30:00"
          />
        </View>

        {/* Estado */}
        {renderStatusSelector()}

        {/* Comentarios adicionales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentarios adicionales</Text>
          
          <InputField
            label="Comentarios"
            value={form.comentarios}
            onChangeText={(text: string) => handleChange('comentarios', text)}
            placeholder="Agrega comentarios o notas especiales..."
            multiline
            numberOfLines={4}
            style={styles.commentsInput}
          />
        </View>
      </ScrollView>

      {/* Footer con acciones */}
      <View style={styles.footer}>
        <CustomButton
          title="Cancelar"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.footerButton}
        />
        <CustomButton
          title={saving ? "Guardando..." : "Guardar Cambios"}
          onPress={handleSubmit}
          variant="primary"
          style={styles.footerButton}
          loading={saving}
          disabled={saving}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    ...globalStyles.container,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...globalStyles.title,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...globalStyles.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...globalStyles.bodyText,
    color: colors.textSecondary,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for footer
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusSection: {
    marginBottom: 32,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    minWidth: width * 0.42,
    justifyContent: 'center',
  },
  statusChipActive: {
    backgroundColor: colors.background,
    borderWidth: 2,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  statusTextActive: {
    fontWeight: '600',
  },
  commentsInput: {
    height: 100,
  },
  errorText: {
    ...globalStyles.caption,
    color: colors.error,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  footerButton: {
    flex: 1,
  },
});

export default EditReservationScreen;