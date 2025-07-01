import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { createTransaction, updateTransaction, TransaccionRequest, TransaccionResponse, TipoTransaccion } from '../api/transactions';
import { getAllProperties, PropertyResponse } from '../api/properties';
import { getAllUsers } from '../api/users';
import { getUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

// Tipos de navegación
type TransactionFormRouteProp = RouteProp<{ TransactionForm: { propiedadId?: number } }, 'TransactionForm'>;
type TransactionFormNavigationProp = StackNavigationProp<any>;

export default function TransactionFormScreen() {
  const navigation = useNavigation<TransactionFormNavigationProp>();
  const route = useRoute<TransactionFormRouteProp>();
  const propiedadIdParam = route.params?.propiedadId;
  const { showError, showSuccess } = useToast();

  const [form, setForm] = useState<TransaccionRequest>({
    propiedadId: propiedadIdParam || 0,
    clienteId: 0,
    agenteId: 0,
    tipo: 'VENTA',
    monto: 0,
    comisionAgente: 0,
    detalles: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      // Cargar datos necesarios
      const [propertiesData, usersData, userProfile] = await Promise.all([
        getAllProperties(),
        getAllUsers(),
        getUserProfile()
      ]);

      setProperties(propertiesData);
      setUsers(usersData);
      setCurrentUser(userProfile);

      // Si el usuario actual es agente, establecerlo como agente por defecto
      if (userProfile.role === 'AGENTE') {
        setForm(prev => ({ ...prev, agenteId: userProfile.id }));
      }
    } catch (error) {
      showError('No se pudieron cargar los datos necesarios');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.propiedadId) {
      newErrors.propiedadId = 'Debe seleccionar una propiedad';
    }
    if (!form.clienteId) {
      newErrors.clienteId = 'Debe seleccionar un cliente';
    }
    if (!form.agenteId) {
      newErrors.agenteId = 'Debe seleccionar un agente';
    }
    if (form.monto <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }
    if (form.comisionAgente < 0) {
      newErrors.comisionAgente = 'La comisión no puede ser negativa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Por favor, complete todos los campos correctamente');
      return;
    }

    setLoading(true);
    try {
      await createTransaction(form);
      showSuccess('Transacción creada exitosamente');
      navigation.goBack();
    } catch (error) {
      showError('Error al crear la transacción');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSelectedProperty = () => {
    return properties.find(p => p.id === form.propiedadId);
  };

  const getSelectedClient = () => {
    return users.find(u => u.id === form.clienteId);
  };

  const getSelectedAgent = () => {
    return users.find(u => u.id === form.agenteId);
  };

  const clients = users.filter(user => user.role === 'CLIENTE');
  const agents = users.filter(user => user.role === 'AGENTE');

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando datos...</Text>
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
        <Text style={styles.headerTitle}>Nueva Transacción</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tipo de Transacción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Transacción</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeOption, form.tipo === 'VENTA' && styles.typeOptionActive]}
              onPress={() => setForm({ ...form, tipo: 'VENTA' })}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons 
                  name="home" 
                  size={24} 
                  color={form.tipo === 'VENTA' ? colors.background : colors.textSecondary} 
                />
              </View>
              <Text style={[
                styles.typeOptionText,
                form.tipo === 'VENTA' && styles.typeOptionTextActive
              ]}>
                Venta
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.typeOption, form.tipo === 'ALQUILER' && styles.typeOptionActive]}
              onPress={() => setForm({ ...form, tipo: 'ALQUILER' })}
            >
              <View style={styles.typeIconContainer}>
                <Ionicons 
                  name="key" 
                  size={24} 
                  color={form.tipo === 'ALQUILER' ? colors.background : colors.textSecondary} 
                />
              </View>
              <Text style={[
                styles.typeOptionText,
                form.tipo === 'ALQUILER' && styles.typeOptionTextActive
              ]}>
                Alquiler
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Propiedad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propiedad *</Text>
          <TouchableOpacity
            style={[styles.selector, errors.propiedadId && styles.selectorError]}
            onPress={() => setShowPropertyModal(true)}
          >
            <View style={styles.selectorContent}>
              <Ionicons name="business" size={20} color={colors.textSecondary} />
              <View style={styles.selectorTextContainer}>
                {getSelectedProperty() ? (
                  <>
                    <Text style={styles.selectorText}>{getSelectedProperty()?.titulo}</Text>
                    <Text style={styles.selectorSubtext}>
                      {getSelectedProperty()?.direccion} • {formatCurrency(getSelectedProperty()?.precio || 0)}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholder}>Seleccionar propiedad</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
          {errors.propiedadId && <Text style={styles.errorText}>{errors.propiedadId}</Text>}
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente *</Text>
          <TouchableOpacity
            style={[styles.selector, errors.clienteId && styles.selectorError]}
            onPress={() => setShowClientModal(true)}
          >
            <View style={styles.selectorContent}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
              <View style={styles.selectorTextContainer}>
                {getSelectedClient() ? (
                  <>
                    <Text style={styles.selectorText}>
                      {getSelectedClient()?.nombre} {getSelectedClient()?.apellido}
                    </Text>
                    <Text style={styles.selectorSubtext}>{getSelectedClient()?.email}</Text>
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholder}>Seleccionar cliente</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
          {errors.clienteId && <Text style={styles.errorText}>{errors.clienteId}</Text>}
        </View>

        {/* Agente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agente *</Text>
          <TouchableOpacity
            style={[styles.selector, errors.agenteId && styles.selectorError]}
            onPress={() => setShowAgentModal(true)}
          >
            <View style={styles.selectorContent}>
              <Ionicons name="briefcase" size={20} color={colors.textSecondary} />
              <View style={styles.selectorTextContainer}>
                {getSelectedAgent() ? (
                  <>
                    <Text style={styles.selectorText}>
                      {getSelectedAgent()?.nombre} {getSelectedAgent()?.apellido}
                    </Text>
                    <Text style={styles.selectorSubtext}>{getSelectedAgent()?.email}</Text>
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholder}>Seleccionar agente</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
          {errors.agenteId && <Text style={styles.errorText}>{errors.agenteId}</Text>}
        </View>

        {/* Monto */}
        <View style={styles.section}>
          <InputField
            label="Monto de la transacción *"
            placeholder="Ingrese el monto"
            value={form.monto > 0 ? form.monto.toString() : ''}
            onChangeText={(text) => {
              const numericValue = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
              setForm({ ...form, monto: numericValue });
              if (errors.monto) setErrors({ ...errors, monto: '' });
            }}
            keyboardType="numeric"
            leftIcon="cash"
            error={errors.monto}
          />
        </View>

        {/* Comisión */}
        <View style={styles.section}>
          <InputField
            label="Comisión del agente *"
            placeholder="Ingrese la comisión"
            value={form.comisionAgente > 0 ? form.comisionAgente.toString() : ''}
            onChangeText={(text) => {
              const numericValue = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
              setForm({ ...form, comisionAgente: numericValue });
              if (errors.comisionAgente) setErrors({ ...errors, comisionAgente: '' });
            }}
            keyboardType="numeric"
            leftIcon="trending-up"
            error={errors.comisionAgente}
          />
        </View>

        {/* Detalles */}
        <View style={styles.section}>
          <InputField
            label="Detalles adicionales"
            placeholder="Observaciones, notas especiales..."
            value={form.detalles || ''}
            onChangeText={(text) => setForm({ ...form, detalles: text })}
            multiline
            numberOfLines={4}
            leftIcon="document-text"
          />
        </View>

        {/* Resumen */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="calculator" size={20} color={colors.primary} />
            <Text style={styles.summaryTitle}>Resumen de la transacción</Text>
          </View>
          
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tipo:</Text>
              <Text style={styles.summaryValue}>{form.tipo}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monto base:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(form.monto)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Comisión agente:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(form.comisionAgente)}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelTotal}>Total:</Text>
              <Text style={styles.summaryValueTotal}>
                {formatCurrency(form.monto + form.comisionAgente)}
              </Text>
            </View>
          </View>
        </View>

        {/* Botón de acción */}
        <View style={styles.actionContainer}>
          <CustomButton
            title={loading ? "Creando transacción..." : "Crear transacción"}
            onPress={handleSubmit}
            disabled={loading}
            variant="primary"
            size="large"
            leftIcon={loading ? undefined : "checkmark-circle"}
          />
        </View>
      </ScrollView>

      {/* Modal de Propiedades */}
      <Modal
        visible={showPropertyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPropertyModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Propiedad</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <FlatList
            data={properties}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  form.propiedadId === item.id && styles.modalItemSelected
                ]}
                onPress={() => {
                  setForm({ ...form, propiedadId: item.id });
                  setShowPropertyModal(false);
                  if (errors.propiedadId) setErrors({ ...errors, propiedadId: '' });
                }}
              >
                <View style={styles.modalItemContent}>
                  <Ionicons name="business" size={20} color={colors.textSecondary} />
                  <View style={styles.modalItemText}>
                    <Text style={styles.modalItemTitle}>{item.titulo}</Text>
                    <Text style={styles.modalItemSubtitle}>{item.direccion}</Text>
                    <Text style={styles.modalItemPrice}>{formatCurrency(item.precio)}</Text>
                  </View>
                  {form.propiedadId === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            )}
            style={styles.modalList}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Clientes */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowClientModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  form.clienteId === item.id && styles.modalItemSelected
                ]}
                onPress={() => {
                  setForm({ ...form, clienteId: item.id });
                  setShowClientModal(false);
                  if (errors.clienteId) setErrors({ ...errors, clienteId: '' });
                }}
              >
                <View style={styles.modalItemContent}>
                  <Ionicons name="person" size={20} color={colors.textSecondary} />
                  <View style={styles.modalItemText}>
                    <Text style={styles.modalItemTitle}>
                      {item.nombre} {item.apellido}
                    </Text>
                    <Text style={styles.modalItemSubtitle}>{item.email}</Text>
                  </View>
                  {form.clienteId === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            )}
            style={styles.modalList}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Agentes */}
      <Modal
        visible={showAgentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAgentModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Agente</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <FlatList
            data={agents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  form.agenteId === item.id && styles.modalItemSelected
                ]}
                onPress={() => {
                  setForm({ ...form, agenteId: item.id });
                  setShowAgentModal(false);
                  if (errors.agenteId) setErrors({ ...errors, agenteId: '' });
                }}
              >
                <View style={styles.modalItemContent}>
                  <Ionicons name="briefcase" size={20} color={colors.textSecondary} />
                  <View style={styles.modalItemText}>
                    <Text style={styles.modalItemTitle}>
                      {item.nombre} {item.apellido}
                    </Text>
                    <Text style={styles.modalItemSubtitle}>{item.email}</Text>
                  </View>
                  {form.agenteId === item.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            )}
            style={styles.modalList}
          />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeIconContainer: {
    marginBottom: 8,
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeOptionTextActive: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
    textAlign: 'center',
  },
  selector: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 60,
  },
  selectorError: {
    borderColor: colors.error,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  selectorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
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
    fontSize: 18,
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
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  summaryLabelTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionContainer: {
    marginTop: 32,
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
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemText: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
});
