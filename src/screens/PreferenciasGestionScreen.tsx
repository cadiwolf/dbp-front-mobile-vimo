import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, Modal, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import {
  listarPreferenciasPorUsuario,
  crearPreferencia,
  actualizarPreferencia,
  eliminarPreferencia,
  PreferenciaNotificacionRequest,
  PreferenciaNotificacionResponse,
  TipoTransaccion,
  TipoBusqueda,
} from '../api/preferenciaNotificacion';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { useToast } from '../components/ToastProvider';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';

// Simula obtener el usuario autenticado (ajusta según tu auth real)
const userId = 1;

const { width } = Dimensions.get('window');

const defaultForm: PreferenciaNotificacionRequest = {
  usuarioId: userId,
  regionInteres: '',
  distritoInteres: '',
  tipo: 'VENTA',
  tipoBusqueda: 'POR_UBICACION',
  activa: true,
};

const tiposTransaccion: { key: TipoTransaccion; label: string; icon: string }[] = [
  { key: 'VENTA', label: 'Venta', icon: '🏠' },
  { key: 'ALQUILER', label: 'Alquiler', icon: '🏡' },
];

const tiposBusqueda: { key: TipoBusqueda; label: string; icon: string }[] = [
  { key: 'POR_UBICACION', label: 'Por ubicación', icon: '📍' },
  { key: 'POR_PROXIMIDAD', label: 'Por proximidad', icon: '📍' },
  { key: 'AMBAS', label: 'Ambas', icon: '🎯' },
];

export default function PreferenciasGestionScreen() {
  const [preferencias, setPreferencias] = useState<PreferenciaNotificacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<PreferenciaNotificacionRequest>(defaultForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError } = useToast();

  const cargarPreferencias = useCallback(async () => {
    try {
      const data = await listarPreferenciasPorUsuario(userId);
      setPreferencias(data);
    } catch (e) {
      showError('No se pudieron cargar las preferencias');
    }
  }, [showError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await cargarPreferencias();
      showSuccess('Preferencias actualizadas');
    } catch (e) {
      showError('Error al actualizar preferencias');
    } finally {
      setRefreshing(false);
    }
  }, [cargarPreferencias, showSuccess, showError]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await cargarPreferencias();
      setLoading(false);
    };
    loadData();
  }, [cargarPreferencias]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.regionInteres?.trim()) {
      newErrors.regionInteres = 'La región es requerida';
    }

    if (!form.distritoInteres?.trim()) {
      newErrors.distritoInteres = 'El distrito es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardar = useCallback(async () => {
    if (!validateForm()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      if (editId) {
        await actualizarPreferencia(editId, form);
        showSuccess('Preferencia actualizada correctamente');
      } else {
        await crearPreferencia(form);
        showSuccess('Preferencia creada correctamente');
      }
      setModalVisible(false);
      setForm(defaultForm);
      setEditId(null);
      setErrors({});
      cargarPreferencias();
    } catch {
      showError('No se pudo guardar la preferencia');
    }
  }, [editId, form, cargarPreferencias, showSuccess, showError]);

  const handleEditar = useCallback((pref: PreferenciaNotificacionResponse) => {
    setForm({ ...pref });
    setEditId(pref.id);
    setErrors({});
    setModalVisible(true);
  }, []);

  const handleEliminar = useCallback(async (id: number) => {
    Alert.alert(
      'Eliminar preferencia',
      '¿Estás seguro de que deseas eliminar esta preferencia?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarPreferencia(id);
              showSuccess('Preferencia eliminada correctamente');
              cargarPreferencias();
            } catch {
              showError('No se pudo eliminar la preferencia');
            }
          },
        },
      ]
    );
  }, [cargarPreferencias, showSuccess, showError]);

  const handleCloseModal = () => {
    setModalVisible(false);
    setForm(defaultForm);
    setEditId(null);
    setErrors({});
  };

  const renderPreferenciaCard = ({ item }: { item: PreferenciaNotificacionResponse }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>Preferencia #{item.id}</Text>
          <View style={[styles.statusBadge, item.activa ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>{item.activa ? 'Activa' : 'Inactiva'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <View>
            <Text style={styles.detailLabel}>Ubicación</Text>
            <Text style={styles.detailValue}>{item.regionInteres}, {item.distritoInteres}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>💼</Text>
          <View>
            <Text style={styles.detailLabel}>Tipo de transacción</Text>
            <Text style={styles.detailValue}>{item.tipo}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🔍</Text>
          <View>
            <Text style={styles.detailLabel}>Tipo de búsqueda</Text>
            <Text style={styles.detailValue}>{item.tipoBusqueda?.replace('POR_', '').replace('_', ' ') || 'No especificado'}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <CustomButton 
          title="Editar" 
          onPress={() => handleEditar(item)}
          variant="outline"
          size="small"
          style={styles.actionButton}
        />
        <CustomButton 
          title="Eliminar" 
          onPress={() => handleEliminar(item.id)}
          variant="error"
          size="small"
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>Sin preferencias</Text>
      <Text style={styles.emptyText}>
        No tienes preferencias de notificación configuradas
      </Text>
      <Text style={styles.emptySubtext}>
        Crea una nueva preferencia para recibir notificaciones personalizadas
      </Text>
      <CustomButton
        title="Crear preferencia"
        onPress={() => {
          setForm(defaultForm);
          setEditId(null);
          setErrors({});
          setModalVisible(true);
        }}
        style={styles.emptyButton}
        variant="primary"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Preferencias de notificación</Text>
        <Text style={styles.subtitle}>
          Gestiona tus preferencias para recibir notificaciones personalizadas
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{preferencias.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{preferencias.filter(p => p.activa).length}</Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{preferencias.filter(p => !p.activa).length}</Text>
          <Text style={styles.statLabel}>Inactivas</Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        <CustomButton 
          title="Nueva preferencia" 
          onPress={() => {
            setForm(defaultForm);
            setEditId(null);
            setErrors({});
            setModalVisible(true);
          }}
          variant="primary"
          style={styles.newButton}
        />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando preferencias...</Text>
          </View>
        ) : (
          <FlatList
            data={preferencias}
            keyExtractor={item => item.id.toString()}
            renderItem={renderPreferenciaCard}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                title="Actualizando..."
                titleColor={colors.primary}
              />
            }
            contentContainerStyle={preferencias.length === 0 ? styles.emptyList : styles.list}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={10}
          />
        )}
      </View>
      
      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editId ? 'Editar preferencia' : 'Nueva preferencia'}
                </Text>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Campos de entrada */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Ubicación de interés</Text>
                  
                  <InputField
                    label="Región"
                    value={form.regionInteres || ''}
                    onChangeText={(text: string) => setForm(f => ({ ...f, regionInteres: text }))}
                    error={errors.regionInteres}
                    placeholder="Ej: Lima, Arequipa, Cusco"
                    style={styles.input}
                  />
                  
                  <InputField
                    label="Distrito"
                    value={form.distritoInteres || ''}
                    onChangeText={(text: string) => setForm(f => ({ ...f, distritoInteres: text }))}
                    error={errors.distritoInteres}
                    placeholder="Ej: Miraflores, San Isidro"
                    style={styles.input}
                  />
                </View>

                {/* Tipo de transacción */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Tipo de transacción</Text>
                  <View style={styles.chipContainer}>
                    {tiposTransaccion.map(tipo => (
                      <TouchableOpacity
                        key={tipo.key}
                        style={[
                          styles.chip,
                          form.tipo === tipo.key && styles.chipActive
                        ]}
                        onPress={() => setForm(f => ({ ...f, tipo: tipo.key }))}
                      >
                        <Text style={styles.chipIcon}>{tipo.icon}</Text>
                        <Text style={[
                          styles.chipText,
                          form.tipo === tipo.key && styles.chipTextActive
                        ]}>
                          {tipo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Tipo de búsqueda */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Tipo de búsqueda</Text>
                  <View style={styles.chipContainer}>
                    {tiposBusqueda.map(tipo => (
                      <TouchableOpacity
                        key={tipo.key}
                        style={[
                          styles.chip,
                          form.tipoBusqueda === tipo.key && styles.chipActive
                        ]}
                        onPress={() => setForm(f => ({ ...f, tipoBusqueda: tipo.key }))}
                      >
                        <Text style={styles.chipIcon}>{tipo.icon}</Text>
                        <Text style={[
                          styles.chipText,
                          form.tipoBusqueda === tipo.key && styles.chipTextActive
                        ]}>
                          {tipo.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Estado */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Estado</Text>
                  <View style={styles.chipContainer}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        form.activa && styles.chipActive
                      ]}
                      onPress={() => setForm(f => ({ ...f, activa: true }))}
                    >
                      <Text style={styles.chipIcon}>✅</Text>
                      <Text style={[
                        styles.chipText,
                        form.activa && styles.chipTextActive
                      ]}>
                        Activa
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        !form.activa && styles.chipActive
                      ]}
                      onPress={() => setForm(f => ({ ...f, activa: false }))}
                    >
                      <Text style={styles.chipIcon}>❌</Text>
                      <Text style={[
                        styles.chipText,
                        !form.activa && styles.chipTextActive
                      ]}>
                        Inactiva
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Acciones del modal */}
              <View style={styles.modalActions}>
                <CustomButton
                  title="Cancelar"
                  onPress={handleCloseModal}
                  variant="outline"
                  style={styles.modalButton}
                />
                <CustomButton
                  title={editId ? 'Actualizar' : 'Crear'}
                  onPress={handleGuardar}
                  variant="primary"
                  style={styles.modalButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  newButton: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    ...globalStyles.bodyText,
    color: colors.textSecondary,
    marginTop: 16,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    ...globalStyles.card,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: colors.success,
  },
  inactiveBadge: {
    backgroundColor: colors.textTertiary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  cardContent: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    ...globalStyles.bodyText,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 200,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  modalBody: {
    padding: 24,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minWidth: 100,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  modalButton: {
    flex: 1,
  },
});
