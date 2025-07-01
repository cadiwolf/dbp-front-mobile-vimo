import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  createUser,
  updateUser,
  getUserById,
  UsuarioRequest,
  UsuarioResponse,
  Roles,
  getRoleDisplayName,
  getRoleColor,
  getRoleIcon,
} from '../api/users';
import { getUserProfile } from '../api/userProfile';
import { ApiErrorHandler, showApiErrorAlert } from '../utils/errorHandler';
import { useErrorHandler } from '../hooks/useErrorHandler';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import ErrorModal from '../components/ErrorModal';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { RootStackParamList } from '../navigation/AppNavigator';

type UserFormNavigationProp = StackNavigationProp<RootStackParamList, 'UserForm'>;
type UserFormRouteProp = RouteProp<RootStackParamList, 'UserForm'>;

interface UserFormProps {
  navigation: UserFormNavigationProp;
  route: UserFormRouteProp;
}

export default function UserFormScreen({ navigation, route }: UserFormProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { errorInfo, showError, handleError, clearError } = useErrorHandler();
  
  // Determinar si estamos editando un usuario existente
  const editingUser = route.params?.user;
  const isEditing = !!editingUser;
  
  // Estado del formulario
  const [formData, setFormData] = useState<UsuarioRequest>({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    rol: 'CLIENTE',
    documentoVerificacion: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roles: Roles[] = ['CLIENTE', 'AGENTE', 'PROPIETARIO', 'ADMIN'];

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (isEditing && editingUser) {
      setFormData({
        nombre: editingUser.nombre || '',
        apellido: editingUser.apellido || '',
        email: editingUser.email || '',
        password: '', // No cargar la contraseña por seguridad
        telefono: editingUser.telefono || '',
        rol: editingUser.rol || 'CLIENTE',
        documentoVerificacion: editingUser.documentoVerificacion || '',
      });
    }
  }, [isEditing, editingUser]);

  const loadCurrentUser = async () => {
    try {
      const userProfile = await getUserProfile();
      setCurrentUser(userProfile);
      
      if (userProfile.role !== 'ADMIN') {
        Alert.alert(
          'Acceso Denegado',
          'Solo los administradores pueden crear o editar usuarios',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
      navigation.goBack();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar campos obligatorios
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.apellido.trim()) {
      errors.apellido = 'El apellido es obligatorio';
    } else if (formData.apellido.trim().length < 2) {
      errors.apellido = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'El formato del email no es válido';
      }
    }

    // Validar contraseña solo al crear usuario nuevo
    if (!isEditing) {
      if (!formData.password) {
        errors.password = 'La contraseña es obligatoria';
      } else if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      } else if (formData.password.length > 50) {
        errors.password = 'La contraseña no puede tener más de 50 caracteres';
      }

      if (formData.password !== confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    // Si estamos editando y se proporciona una nueva contraseña, validarla
    if (isEditing && formData.password) {
      if (formData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      } else if (formData.password.length > 50) {
        errors.password = 'La contraseña no puede tener más de 50 caracteres';
      }

      if (formData.password !== confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    // Validar teléfono si se proporciona
    if (formData.telefono && formData.telefono.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.telefono.replace(/\s+/g, ''))) {
        errors.telefono = 'El formato del teléfono no es válido';
      }
    }

    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Mostrar el primer error
      const firstError = Object.values(errors)[0];
      Alert.alert('Error de Validación', firstError);
      return false;
    }

    return true;
  };

  const clearFieldError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      let userData: UsuarioRequest = { ...formData };

      // Si estamos editando y no se proporciona nueva contraseña, omitirla
      if (isEditing && !formData.password) {
        const { password, ...userDataWithoutPassword } = userData;
        userData = userDataWithoutPassword as UsuarioRequest;
      }

      if (isEditing) {
        await updateUser(editingUser.id, userData);
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        await createUser(userData);
        Alert.alert('Éxito', 'Usuario creado correctamente');
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving user:', error);
      handleError(error, isEditing ? 'actualizar usuario' : 'crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof UsuarioRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const getRoleInfo = (role: Roles) => ({
    name: getRoleDisplayName(role),
    color: getRoleColor(role),
    icon: getRoleIcon(role),
    description: getRoleDescription(role)
  });

  const getRoleDescription = (role: Roles): string => {
    switch (role) {
      case 'ADMIN':
        return 'Acceso completo al sistema';
      case 'AGENTE':
        return 'Gestión de propiedades y transacciones';
      case 'PROPIETARIO':
        return 'Gestión de propiedades propias';
      case 'CLIENTE':
        return 'Búsqueda y reserva de propiedades';
      default:
        return '';
    }
  };

  const renderRoleSelector = () => (
    <View style={styles.roleSelectorContainer}>
      <Text style={[globalStyles.inputLabel, { marginBottom: 8 }]}>
        Rol del Usuario <Text style={{ color: colors.error }}>*</Text>
      </Text>
      <TouchableOpacity
        style={styles.roleSelector}
        onPress={() => setShowRoleModal(true)}
        activeOpacity={0.7}
      >
        <View style={styles.roleSelectorContent}>
          <View style={styles.selectedRoleInfo}>
            <View style={[styles.selectedRoleBadge, { backgroundColor: getRoleColor(formData.rol!) }]}>
              <Text style={styles.selectedRoleText}>
                {getRoleDisplayName(formData.rol!)}
              </Text>
            </View>
            <Text style={styles.roleDescription}>
              {getRoleDescription(formData.rol!)}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const RoleModal = () => (
    <Modal
      visible={showRoleModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowRoleModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Seleccionar Rol</Text>
          <TouchableOpacity onPress={() => setShowRoleModal(false)}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalDescription}>
            Selecciona el rol que mejor describa las responsabilidades del usuario
          </Text>
          
          {roles.map((role) => {
            const roleInfo = getRoleInfo(role);
            const isSelected = formData.rol === role;
            
            return (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  isSelected && styles.roleOptionSelected
                ]}
                onPress={() => {
                  updateFormData('rol', role);
                  setShowRoleModal(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.roleOptionContent}>
                  <View style={[styles.roleOptionBadge, { backgroundColor: roleInfo.color }]}>
                    <Text style={styles.roleOptionText}>
                      {roleInfo.name}
                    </Text>
                  </View>
                  <Text style={styles.roleOptionDescription}>
                    {roleInfo.description}
                  </Text>
                </View>
                
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.bodyTextSecondary, styles.loadingText]}>
          Cargando información...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[globalStyles.container, globalStyles.safeArea]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={globalStyles.title}>
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>
              <Text style={globalStyles.subtitle}>
                {isEditing 
                  ? `Modificar información de ${editingUser?.nombre} ${editingUser?.apellido}`
                  : 'Completa la información del nuevo usuario'
                }
              </Text>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Formulario Principal */}
          <View style={[globalStyles.card, styles.formCard]}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <InputField
                  label="Nombre"
                  value={formData.nombre}
                  onChangeText={(value) => updateFormData('nombre', value)}
                  placeholder="Ingrese el nombre"
                  error={formErrors.nombre}
                  required
                />
              </View>
              <View style={styles.formField}>
                <InputField
                  label="Apellido"
                  value={formData.apellido}
                  onChangeText={(value) => updateFormData('apellido', value)}
                  placeholder="Ingrese el apellido"
                  error={formErrors.apellido}
                  required
                />
              </View>
            </View>

            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={formErrors.email}
              editable={!isEditing}
              helperText={isEditing ? "No se puede cambiar el email de un usuario existente" : undefined}
              required
            />

            <InputField
              label="Teléfono"
              value={formData.telefono || ''}
              onChangeText={(value) => updateFormData('telefono', value)}
              placeholder="Ingrese el teléfono"
              keyboardType="phone-pad"
              error={formErrors.telefono}
              helperText="Formato: +123456789 o 123456789"
            />
          </View>

          {/* Sección de Seguridad */}
          <View style={[globalStyles.card, styles.formCard]}>
            <Text style={styles.sectionTitle}>Seguridad</Text>
            
            <InputField
              label={isEditing ? 'Nueva Contraseña' : 'Contraseña'}
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              placeholder={isEditing ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
              secureTextEntry={!showPassword}
              error={formErrors.password}
              required={!isEditing}
              helperText={isEditing ? "Solo completa si deseas cambiar la contraseña" : "La contraseña debe tener al menos 6 caracteres"}
            />

            {(!isEditing || formData.password) && (
              <InputField
                label="Confirmar Contraseña"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  clearFieldError('confirmPassword');
                }}
                placeholder="Confirme la contraseña"
                secureTextEntry={!showConfirmPassword}
                error={formErrors.confirmPassword}
                required
              />
            )}
          </View>

          {/* Sección de Rol y Permisos */}
          <View style={[globalStyles.card, styles.formCard]}>
            <Text style={styles.sectionTitle}>Rol y Permisos</Text>
            {renderRoleSelector()}
          </View>

          {/* Sección de Verificación */}
          <View style={[globalStyles.card, styles.formCard]}>
            <Text style={styles.sectionTitle}>Verificación</Text>
            
            <InputField
              label="Documento de Verificación"
              value={formData.documentoVerificacion || ''}
              onChangeText={(value) => updateFormData('documentoVerificacion', value)}
              placeholder="URL o ruta del documento"
              helperText="Opcional: enlace o referencia al documento de verificación"
              multiline
              numberOfLines={2}
            />
          </View>
        </ScrollView>

        {/* Acciones del formulario */}
        <View style={styles.actionsContainer}>
          <CustomButton
            title={saving ? "Guardando..." : (isEditing ? "Actualizar Usuario" : "Crear Usuario")}
            variant="primary"
            size="large"
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            style={styles.primaryAction}
          />
          <CustomButton
            title="Cancelar"
            variant="secondary"
            size="large"
            onPress={() => navigation.goBack()}
            disabled={saving}
            style={styles.secondaryAction}
          />
        </View>

        <RoleModal />
        
        <ErrorModal
          visible={showError}
          title={isEditing ? 'Error al Actualizar Usuario' : 'Error al Crear Usuario'}
          message={errorInfo?.message || ''}
          validationErrors={errorInfo?.validationErrors}
          onDismiss={clearError}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    marginTop: -4,
  },
  headerInfo: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formCard: {
    marginBottom: 20,
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
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formField: {
    flex: 1,
  },
  roleSelectorContainer: {
    marginBottom: 16,
  },
  roleSelector: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.backgroundSecondary,
  },
  roleSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedRoleInfo: {
    flex: 1,
  },
  selectedRoleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  selectedRoleText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryAction: {
    marginBottom: 12,
  },
  secondaryAction: {
    marginBottom: 0,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  roleOptionText: {
    color: colors.textLight,
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleOptionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
