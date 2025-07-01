import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createProperty, updateProperty, PropertyRequest, PropertyResponse, EstadoPropiedad, TipoPropiedad } from '../api/properties';
import { UbicacionGeografica } from '../api/locations';
import { getToken } from '../utils/token';
import LocationPicker from '../components/LocationPicker';
import LocationDisplay from '../components/LocationDisplay';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

// Props: si recibe property, es edición; si no, es creación
export default function PropertyFormScreen({ route, navigation }: any) {
  const editing = !!route.params?.property;
  const userId = route.params?.userId || 1; // Ajusta según tu auth
  const [form, setForm] = useState<PropertyRequest>(
    editing
      ? { ...route.params.property }
      : {
          titulo: '',
          descripcion: '',
          direccion: '',
          tipo: 'DEPARTAMENTO',
          metrosCuadrados: 0,
          precio: 0,
          estado: 'DISPONIBLE',
          propietarioId: userId,
          imagenes: '',
        }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [imageUris, setImageUris] = useState<string[]>(form.imagenes ? form.imagenes.split(',') : []);
  const [selectedLocation, setSelectedLocation] = useState<UbicacionGeografica | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(!editing);

  const propertyTypes = [
    { value: 'DEPARTAMENTO', label: 'Departamento', icon: 'business-outline' },
    { value: 'CASA', label: 'Casa', icon: 'home-outline' },
    { value: 'OFICINA', label: 'Oficina', icon: 'briefcase-outline' },
    { value: 'LOCAL_COMERCIAL', label: 'Local Comercial', icon: 'storefront-outline' },
  ];

  const propertyStates = [
    { value: 'DISPONIBLE', label: 'Disponible', color: colors.success },
    { value: 'RESERVADA', label: 'Reservada', color: colors.warning },
    { value: 'VENDIDA', label: 'Vendida', color: colors.error },
  ];

  React.useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
      }
    };
    checkAuth();
  }, [navigation]);

  // 📷 SENSOR 1: CÁMARA - Funcionalidades mejoradas
  const requestCameraPermissions = async (): Promise<boolean> => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a la cámara y galería para agregar fotos de la propiedad.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurar', onPress: () => {} }
        ]
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      "Agregar Foto de Propiedad",
      "¿Cómo quieres agregar la foto?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Tomar Foto", onPress: takePhotoWithCamera },
        { text: "Seleccionar de Galería", onPress: pickImageFromGallery }
      ]
    );
  };

  const takePhotoWithCamera = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Aspecto ideal para fotos de propiedades
        quality: 0.8, // Buena calidad pero no excesiva
      });

      if (!result.canceled && result.assets[0]) {
        addImageToProperty(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
      console.error('Camera error:', error);
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false, // Una por vez para mejor UX
      });

      if (!result.canceled && result.assets) {
        result.assets.forEach(asset => {
          addImageToProperty(asset.uri);
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      console.error('Gallery error:', error);
    }
  };

  const addImageToProperty = (uri: string) => {
    if (imageUris.length >= 10) {
      Alert.alert('Límite alcanzado', 'Puedes agregar máximo 10 fotos por propiedad');
      return;
    }
    const newImages = [...imageUris, uri];
    setImageUris(newImages);
    handleChange('imagenes', newImages.join(','));
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'Eliminar foto',
      '¿Estás seguro de que quieres eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const newImages = imageUris.filter((_, i) => i !== index);
            setImageUris(newImages);
            handleChange('imagenes', newImages.join(','));
          }
        }
      ]
    );
  };

  const handleChange = (field: keyof PropertyRequest, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const handleLocationSelect = (location: UbicacionGeografica) => {
    setSelectedLocation(location);
    setShowLocationPicker(false);
    
    // Actualizar la dirección en el formulario
    const direccion = location.direccionCompleta || 
      [location.distrito, location.provincia, location.region].filter(Boolean).join(', ');
    handleChange('direccion', direccion);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!form.titulo.trim()) {
      newErrors.titulo = 'El título es requerido';
    } else if (form.titulo.trim().length < 5) {
      newErrors.titulo = 'El título debe tener al menos 5 caracteres';
    }
    
    if (!form.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida';
    } else if (form.descripcion.trim().length < 20) {
      newErrors.descripcion = 'La descripción debe tener al menos 20 caracteres';
    }
    
    if (!form.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }
    
    if (form.metrosCuadrados <= 0) {
      newErrors.metrosCuadrados = 'Los metros cuadrados deben ser mayor a 0';
    } else if (form.metrosCuadrados > 10000) {
      newErrors.metrosCuadrados = 'Los metros cuadrados no pueden exceder 10,000';
    }
    
    if (form.precio <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    } else if (form.precio > 50000000) {
      newErrors.precio = 'El precio no puede exceder $50,000,000';
    }
    
    if (imageUris.length === 0) {
      newErrors.imagenes = 'Debe agregar al menos una foto de la propiedad';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Formulario incompleto', 'Por favor corrige los errores antes de continuar');
      return;
    }
    
    setLoading(true);
    try {
      if (editing) {
        await updateProperty(route.params.property.id, form);
        Alert.alert('Éxito', 'Propiedad actualizada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createProperty(form);
        Alert.alert('Éxito', 'Propiedad creada correctamente', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving property:', error);
      Alert.alert('Error', 'No se pudo guardar la propiedad. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>
            {editing ? 'Actualizando propiedad...' : 'Creando propiedad...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {editing ? 'Editar Propiedad' : 'Nueva Propiedad'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>
            
            <InputField
              label="Título de la propiedad"
              value={form.titulo}
              onChangeText={(text: string) => handleChange('titulo', text)}
              placeholder="Ej: Departamento moderno en Miraflores"
              error={errors.titulo}
              leftIcon="home-outline"
              maxLength={100}
            />

            <InputField
              label="Descripción"
              value={form.descripcion}
              onChangeText={(text: string) => handleChange('descripcion', text)}
              placeholder="Describe las características principales de la propiedad..."
              error={errors.descripcion}
              leftIcon="document-text-outline"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* Property Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Propiedad</Text>
            <View style={styles.typeGrid}>
              {propertyTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    form.tipo === type.value && styles.typeCardActive
                  ]}
                  onPress={() => handleChange('tipo', type.value)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={form.tipo === type.value ? colors.background : colors.primary}
                  />
                  <Text style={[
                    styles.typeLabel,
                    form.tipo === type.value && styles.typeLabelActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles</Text>
            
            <View style={styles.detailsRow}>
              <InputField
                label="Metros cuadrados"
                value={form.metrosCuadrados.toString()}
                onChangeText={(text: string) => handleChange('metrosCuadrados', parseInt(text) || 0)}
                placeholder="120"
                keyboardType="numeric"
                error={errors.metrosCuadrados}
                leftIcon="resize-outline"
                style={styles.halfWidth}
              />

              <InputField
                label="Precio (USD)"
                value={form.precio.toString()}
                onChangeText={(text: string) => handleChange('precio', parseFloat(text) || 0)}
                placeholder="250,000"
                keyboardType="numeric"
                error={errors.precio}
                leftIcon="cash-outline"
                style={styles.halfWidth}
              />
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            
            {showLocationPicker ? (
              <View style={styles.locationPicker}>
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  placeholder="Buscar dirección..."
                  initialValue={form.direccion}
                />
              </View>
            ) : (
              <View>
                {selectedLocation && (
                  <LocationDisplay
                    location={selectedLocation}
                    showDetails={true}
                    style={styles.locationDisplay}
                  />
                )}
                <CustomButton
                  title="Cambiar Ubicación"
                  onPress={() => setShowLocationPicker(true)}
                  variant="secondary"
                  leftIcon="location-outline"
                  size="small"
                />
              </View>
            )}

            <InputField
              label="Dirección completa"
              value={form.direccion}
              onChangeText={(text: string) => handleChange('direccion', text)}
              placeholder="Dirección completa de la propiedad"
              error={errors.direccion}
              leftIcon="map-outline"
            />
          </View>

          {/* Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado de la Propiedad</Text>
            <View style={styles.statusGrid}>
              {propertyStates.map((state) => (
                <TouchableOpacity
                  key={state.value}
                  style={[
                    styles.statusCard,
                    form.estado === state.value && { borderColor: state.color, backgroundColor: `${state.color}20` }
                  ]}
                  onPress={() => handleChange('estado', state.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: state.color }]} />
                  <Text style={[
                    styles.statusLabel,
                    form.estado === state.value && { color: state.color, fontWeight: '600' }
                  ]}>
                    {state.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Images Section */}
          <View style={styles.section}>
            <View style={styles.imagesSectionHeader}>
              <Text style={styles.sectionTitle}>Fotos de la Propiedad</Text>
              <Text style={styles.imagesCounter}>
                {imageUris.length}/10
              </Text>
            </View>
            {errors.imagenes && <Text style={styles.errorText}>{errors.imagenes}</Text>}
            
            <View style={styles.imageGallery}>
              {imageUris.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color={colors.background} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {imageUris.length < 10 && (
                <TouchableOpacity 
                  style={styles.addImageButton}
                  onPress={showImagePickerOptions}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={32} color={colors.primary} />
                  <Text style={styles.addImageLabel}>Agregar Foto</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <CustomButton 
              title={editing ? 'Actualizar Propiedad' : 'Crear Propiedad'}
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              leftIcon={editing ? 'checkmark' : 'add'}
              style={styles.submitButton}
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
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  typeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: colors.background,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  locationPicker: {
    marginBottom: 16,
  },
  locationDisplay: {
    marginBottom: 16,
  },
  statusGrid: {
    gap: 12,
  },
  statusCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  imagesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imagesCounter: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  addImageButton: {
    width: 100,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  addImageLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  submitSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  submitButton: {
    marginBottom: 16,
  },
});
