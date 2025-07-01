import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Linking,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPropertyById } from '../api/properties';
import MapView, { Marker } from 'react-native-maps';
import { getUserFavorites, addFavorite, removeFavorite, getUserProfile } from '../api/userProfile';
import CustomButton from '../components/CustomButton';
import { getToken } from '../utils/token';
import DeviceOrientationSensor from '../components/DeviceOrientationSensor';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

const { width: screenWidth } = Dimensions.get('window');

export default function PropertyDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
        return;
      }
      if (!id || isNaN(Number(id))) {
        Alert.alert('Error', 'ID de propiedad inválido.');
        navigation.goBack();
        return;
      }
      setLoading(true);
      try {
        const data = await getPropertyById(id);
        setProperty(data);
        const favs = await getUserFavorites();
        setIsFavorite(favs.some((f: any) => f.id?.toString() === id.toString()));
        // Obtener usuario autenticado para el chat
        const user = await getUserProfile();
        setUserId(user.id);
      } catch (error) {
        console.error('Error fetching property details:', error);
        setProperty(null);
        setIsFavorite(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetch();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFavorite(id.toString());
        setIsFavorite(false);
        Alert.alert('Eliminado de favoritos', 'La propiedad fue eliminada de tus favoritos.');
      } else {
        await addFavorite(id.toString());
        setIsFavorite(true);
        Alert.alert('Agregado a favoritos', 'La propiedad fue agregada a tus favoritos.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de favorito.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira esta propiedad! ${property.titulo || 'Propiedad'}\n\nPrecio: ${formatPrice(property.precio)}\nUbicación: ${property.direccion || property.ubicacion}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCall = () => {
    if (property.telefono) {
      Linking.openURL(`tel:${property.telefono}`);
    }
  };

  const handleEmail = () => {
    if (property.email) {
      Linking.openURL(`mailto:${property.email}?subject=Consulta sobre ${property.titulo}`);
    }
  };

  const handleWhatsApp = () => {
    if (property.telefono) {
      const message = encodeURIComponent(`Hola, estoy interesado en la propiedad: ${property.titulo}`);
      Linking.openURL(`whatsapp://send?phone=${property.telefono}&text=${message}`);
    }
  };

  const handleStartChat = () => {
    if (!userId || !property?.agenteId) {
      Alert.alert('Error', 'No se pudo obtener el usuario o agente.');
      return;
    }
    navigation.navigate('Chat', {
      remitenteId: userId,
      destinatarioId: property.agenteId,
      agenteId: property.agenteId,
      propiedadId: property.id,
      titulo: property.titulo || 'Propiedad',
    });
  };

  const formatPrice = (price: number | string) => {
    if (!price) return 'Precio no disponible';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={globalStyles.loadingText}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="home-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.errorTitle}>Propiedad no encontrada</Text>
          <Text style={styles.errorSubtitle}>La propiedad que buscas no está disponible</Text>
          <CustomButton
            title="Volver"
            onPress={() => navigation.goBack()}
            variant="secondary"
            leftIcon="arrow-back"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const images: string[] = property.imagenes || [];
  const lat = property.latitud || property.lat || 0;
  const lng = property.longitud || property.lng || 0;

  return (
    <SafeAreaView style={globalStyles.container}>
      {/* Header with Back and Actions */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, isFavorite && styles.favoriteActive]}
            onPress={handleToggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={24} 
              color={isFavorite ? colors.error : colors.textPrimary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          {images.length > 0 ? (
            <>
              <ScrollView 
                horizontal 
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                  setCurrentImageIndex(newIndex);
                }}
              >
                {images.map((img, idx) => (
                  <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
                ))}
              </ScrollView>
              {images.length > 1 && (
                <View style={styles.imageIndicators}>
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.indicator,
                        currentImageIndex === idx && styles.indicatorActive
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.noImageText}>Sin imágenes disponibles</Text>
            </View>
          )}
        </View>

        {/* Property Information */}
        <View style={styles.infoContainer}>
          {/* Title and Price */}
          <View style={styles.titleSection}>
            <Text style={styles.propertyTitle}>
              {property.titulo || property.nombre || 'Propiedad'}
            </Text>
            <Text style={styles.propertyPrice}>
              {formatPrice(property.precio)}
            </Text>
          </View>

          {/* Property Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={styles.detailText}>
                {property.ubicacion || property.direccion || 'Ubicación no disponible'}
              </Text>
            </View>

            {property.tipo && (
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={20} color={colors.primary} />
                <Text style={styles.detailText}>
                  {property.tipo.charAt(0).toUpperCase() + property.tipo.slice(1)}
                </Text>
              </View>
            )}

            {property.area && (
              <View style={styles.detailRow}>
                <Ionicons name="resize-outline" size={20} color={colors.primary} />
                <Text style={styles.detailText}>
                  {property.area} m²
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {property.descripcion && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.descriptionText}>
                {property.descripcion}
              </Text>
            </View>
          )}

          {/* Map */}
          {lat && lng ? (
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker coordinate={{ latitude: lat, longitude: lng }} />
                </MapView>
              </View>
            </View>
          ) : null}

          {/* Contact Section */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <View style={styles.contactButtons}>
              {property.telefono && (
                <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                  <Ionicons name="call" size={20} color={colors.background} />
                  <Text style={styles.contactButtonText}>Llamar</Text>
                </TouchableOpacity>
              )}
              
              {property.email && (
                <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                  <Ionicons name="mail" size={20} color={colors.background} />
                  <Text style={styles.contactButtonText}>Email</Text>
                </TouchableOpacity>
              )}
              
              {property.telefono && (
                <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={20} color={colors.background} />
                  <Text style={styles.contactButtonText}>WhatsApp</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Device Orientation Sensor */}
          <DeviceOrientationSensor />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <CustomButton
            title="Agendar Visita"
            onPress={() => navigation.navigate('ScheduleVisit', { propertyId: property.id })}
            leftIcon="calendar"
            style={styles.scheduleButton}
          />
          
          <CustomButton
            title="Chat con Agente"
            onPress={handleStartChat}
            variant="secondary"
            leftIcon="chatbubble"
            style={styles.chatButton}
          />
        </View>
      </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteActive: {
    backgroundColor: colors.errorLight,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  galleryContainer: {
    height: 300,
    backgroundColor: colors.backgroundSecondary,
    position: 'relative',
  },
  galleryImage: {
    width: screenWidth,
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: colors.background,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  noImageText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 32,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  detailsSection: {
    marginBottom: 24,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: colors.textSecondary,
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  mapSection: {
    marginBottom: 24,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  map: {
    width: '100%',
    height: 200,
  },
  contactSection: {
    marginBottom: 24,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  contactButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  scheduleButton: {
    marginBottom: 8,
  },
  chatButton: {
    marginBottom: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
});
