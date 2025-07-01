import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { login } from '../api/auth';
import { showApiErrorAlert } from '../utils/errorHandler';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { colors } from '../styles/colors';
import { globalStyles, spacing } from '../styles/globalStyles';

export default function LoginScreen({ navigation, route }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!email.includes('@')) {
      newErrors.email = 'Ingresa un email válido';
    }
    
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const data = await login(email, password);
      Alert.alert('¡Bienvenido!', 'Inicio de sesión exitoso', [
        { text: 'Continuar', onPress: () => navigation.replace('Main') }
      ]);
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.processedError) {
        const { message } = error.processedError;
        Alert.alert('Error de Acceso', message);
      } else {
        showApiErrorAlert(error, 'iniciar sesión', 'Error de Acceso');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar Contraseña',
      'Esta funcionalidad estará disponible próximamente',
      [{ text: 'Entendido' }]
    );
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
          <View style={styles.logoContainer}>
            <Ionicons name="business-outline" size={48} color={colors.primary} />
            <Text style={styles.appTitle}>VIMO</Text>
          </View>
          <Text style={styles.tagline}>Plataforma Inmobiliaria Empresarial</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>
            Accede a tu cuenta para continuar
          </Text>

          <View style={styles.formFields}>
            <InputField
              label="Correo Electrónico"
              placeholder="ejemplo@empresa.com"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              required
              variant="outlined"
            />

            <InputField
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              isPassword
              error={errors.password}
              required
              variant="outlined"
            />
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              variant="primary"
              size="large"
              leftIcon={
                !loading && <Ionicons name="log-in-outline" size={20} color={colors.textPrimary} />
              }
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.divider} />
            </View>

            <CustomButton
              title="Crear Nueva Cuenta"
              onPress={() => navigation.navigate('Register')}
              variant="outline"
              size="large"
              leftIcon={<Ionicons name="person-add-outline" size={20} color={colors.primary} />}
            />
          </View>

          <TouchableOpacity 
            onPress={handleForgotPassword}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Al iniciar sesión, aceptas nuestros términos y condiciones
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },

  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
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

  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },

  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },

  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.md,
  },

  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
