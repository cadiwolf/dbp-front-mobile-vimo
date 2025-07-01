import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, updateUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

export default function EditProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const user = await getUserProfile();
        setProfile(user);
        setName(user.nombre || user.name || '');
        setEmail(user.email || '');
        setPhone(user.telefono || user.phone || '');
        setImage(user.fotoPerfil || null);
      } catch {
        Alert.alert('Error', 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\d{8,15}$/.test(phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'El teléfono debe tener entre 8 y 15 dígitos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const dataToSend: any = { 
        nombre: name.trim(), 
        email: email.trim(), 
        telefono: phone.trim() 
      };
      
      if (image && image !== profile?.fotoPerfil) {
        dataToSend.fotoPerfil = image;
      }
      
      await updateUserProfile(dataToSend);
      Alert.alert('Éxito', 'Perfil actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="person" size={40} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.imageEditButton}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>Toca para cambiar la foto</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <InputField
              label="Nombre completo"
              value={name}
              onChangeText={setName}
              placeholder="Ingresa tu nombre completo"
              error={errors.name}
              leftIcon="person-outline"
              autoCapitalize="words"
            />

            <InputField
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              error={errors.email}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <InputField
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              placeholder="Número de teléfono"
              error={errors.phone}
              leftIcon="call-outline"
              keyboardType="phone-pad"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <CustomButton
              title={saving ? 'Guardando...' : 'Guardar Cambios'}
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              leftIcon="checkmark"
              style={styles.saveButton}
            />

            <CustomButton
              title="Cancelar"
              onPress={() => navigation.goBack()}
              variant="secondary"
              leftIcon="close"
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.backgroundSecondary,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
    backgroundColor: colors.background,
  },
  saveButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginBottom: 16,
  },
});
