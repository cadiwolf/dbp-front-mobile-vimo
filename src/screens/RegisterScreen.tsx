import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { register } from '../api/auth';
import { showApiErrorAlert } from '../utils/errorHandler';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { colors } from '../styles/colors';
import { globalStyles, spacing } from '../styles/globalStyles';

export default function RegisterScreen({ navigation, route }: any) {
  const [formData, setFormData] = useState({
    name: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    } else if (formData.apellido.trim().length < 2) {
      newErrors.apellido = 'El apellido debe tener al menos 2 caracteres';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Ingresa un email válido';
    }
    
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (formData.phone.trim().length < 8) {
      newErrors.phone = 'Ingresa un número de teléfono válido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const data = await register(
        formData.name.trim(),
        formData.apellido.trim(),
        formData.email.trim(),
        formData.password,
        formData.phone.trim()
      );
      
      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        [
          { 
            text: 'Iniciar Sesión', 
            onPress: () => navigation.replace('Login')
          }
        ]
      );
    } catch (error: any) {
      console.error('Register error:', error);
      
      if (error.processedError) {
        const { message, validationErrors } = error.processedError;
        
        if (validationErrors) {
          // Map validation errors to form fields
          const mappedErrors: {[key: string]: string} = {};
          Object.entries(validationErrors).forEach(([field, msg]) => {
            mappedErrors[field] = msg as string;
          });
          setErrors(mappedErrors);
          Alert.alert('Error de Validación', 'Por favor revisa los campos marcados');
        } else {
          Alert.alert('Error de Registro', message);
        }
      } else {
        showApiErrorAlert(error, 'registrar usuario', 'Error de Registro');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Ionicons name="business-outline" size={40} color={colors.primary} />
            <Text style={styles.appTitle}>VIMO</Text>
          </View>
        </View>

        {/* Register Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Únete a nuestra plataforma inmobiliaria profesional
          </Text>

          <View style={styles.formFields}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <InputField
                  label="Nombre"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChangeText={(text) => updateField('name', text)}
                  leftIcon="person-outline"
                  error={errors.name}
                  required
                  variant="outlined"
                />
              </View>
              
              <View style={styles.nameField}>
                <InputField
                  label="Apellido"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChangeText={(text) => updateField('apellido', text)}
                  leftIcon="person-outline"
                  error={errors.apellido}
                  required
                  variant="outlined"
                />
              </View>
            </View>

            <InputField
              label="Correo Electrónico"
              placeholder="ejemplo@empresa.com"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              required
              variant="outlined"
            />

            <InputField
              label="Teléfono"
              placeholder="+56 9 1234 5678"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              leftIcon="call-outline"
              keyboardType="phone-pad"
              error={errors.phone}
              required
              variant="outlined"
            />

            <InputField
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              leftIcon="lock-closed-outline"
              isPassword
              error={errors.password}
              required
              variant="outlined"
              helperText="Debe tener al menos 6 caracteres"
            />

            <InputField
              label="Confirmar Contraseña"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              leftIcon="checkmark-circle-outline"
              isPassword
              error={errors.confirmPassword}
              required
              variant="outlined"
            />
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              variant="primary"
              size="large"
              leftIcon={
                !loading && <Ionicons name="person-add-outline" size={20} color={colors.textPrimary} />
              }
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.divider} />
            </View>

            <CustomButton
              title="Ya tengo cuenta"
              onPress={() => navigation.navigate('Login')}
              variant="outline"
              size="large"
              leftIcon={<Ionicons name="log-in-outline" size={20} color={colors.primary} />}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al registrarte, aceptas nuestros términos de servicio y política de privacidad
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },

  header: {
    marginBottom: spacing.xl,
  },

  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginBottom: spacing.md,
  },

  logoContainer: {
    alignItems: 'center',
  },

  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
    letterSpacing: 1.5,
  },

  formContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },

  formFields: {
    marginBottom: spacing.xl,
  },

  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  nameField: {
    flex: 1,
  },

  buttonContainer: {
    gap: spacing.md,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },

  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '400',
  },

  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },

  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
