import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile, getUserFavorites, removeFavorite } from '../api/userProfile';
import { removeToken } from '../utils/token';
import CustomButton from '../components/CustomButton';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';
import { globalStyles, spacing, shadows } from '../styles/globalStyles';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen({ navigation, route }: any) {
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const user = await getUserProfile();
      setProfile(user);
      const favs = await getUserFavorites();
      setFavorites(favs);
    } catch (e) {
      setProfile(null);
      setFavorites([]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
      showSuccess('Perfil actualizado');
    } catch (e) {
      showError('Error al actualizar el perfil');
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, showSuccess, showError]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadInitialData();
  }, [fetchData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (!loading && !refreshing) {
        try {
          const favs = await getUserFavorites();
          setFavorites(favs);
        } catch (e) {
          // Mantener favoritos actuales si falla
        }
      }
    });
    return unsubscribe;
  }, [navigation, loading, refreshing]);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await removeToken();
            showSuccess('Sesión cerrada correctamente');
            navigation.replace('Login');
          }
        }
      ]
    );
  }, [navigation, showSuccess]);

  const handleRemoveFavorite = useCallback(async (propertyId: string) => {
    Alert.alert(
      'Eliminar Favorito',
      '¿Estás seguro que deseas eliminar esta propiedad de favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavorite(propertyId);
              setFavorites(prev => prev.filter(f => f.id !== propertyId));
              showSuccess('Propiedad eliminada de favoritos');
            } catch {
              showError('No se pudo eliminar de favoritos');
            }
          }
        }
      ]
    );
  }, [showSuccess, showError]);

  const handleContact = useCallback((property: any) => {
    Alert.alert(
      'Contactar Propietario',
      `¿Deseas contactar al propietario de: ${property.titulo || property.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Contactar', onPress: () => {
          // Implementar lógica de contacto
          Alert.alert('Información', 'Funcionalidad de contacto próximamente disponible');
        }}
      ]
    );
  }, []);

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      ADMIN: 'Administrador',
      PROPIETARIO: 'Propietario',
      AGENTE: 'Agente Inmobiliario',
      CLIENTE: 'Cliente'
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleIcon = (role: string) => {
    const roleIcons = {
      ADMIN: 'shield-checkmark',
      PROPIETARIO: 'business',
      AGENTE: 'briefcase',
      CLIENTE: 'person'
    };
    return roleIcons[role as keyof typeof roleIcons] || 'person';
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      ADMIN: colors.error,
      PROPIETARIO: colors.warning,
      AGENTE: colors.primary,
      CLIENTE: colors.success
    };
    return roleColors[role as keyof typeof roleColors] || colors.textSecondary;
  };

  const renderFavorite = useCallback(({ item }: { item: any }) => (
    <View style={styles.favoriteCard}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('PropertyDetail', { id: item.id })} 
        style={styles.favoriteContent}
        activeOpacity={0.7}
      >
        <View style={styles.favoriteHeader}>
          <Text style={styles.favoriteTitle}>{item.titulo || item.nombre || 'Propiedad'}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
        <Text style={styles.favoriteLocation}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          {' '}{item.ubicacion || item.direccion}
        </Text>
        {item.precio && (
          <Text style={styles.favoritePrice}>
            ${item.precio.toLocaleString('es-CL')}
          </Text>
        )}
      </TouchableOpacity>
      <View style={styles.favoriteActions}>
        <CustomButton
          title="Eliminar"
          onPress={() => handleRemoveFavorite(item.id)}
          variant="error"
          size="small"
          leftIcon={<Ionicons name="trash-outline" size={16} color={colors.textLight} />}
          style={styles.favoriteActionButton}
        />
        <CustomButton
          title="Contactar"
          onPress={() => handleContact(item)}
          variant="success"
          size="small"
          leftIcon={<Ionicons name="call-outline" size={16} color={colors.textLight} />}
          style={styles.favoriteActionButton}
        />
      </View>
    </View>
  ), [navigation, handleRemoveFavorite, handleContact]);

  const renderEmptyFavorites = useMemo(() => (
    <View style={styles.emptyFavoritesContainer}>
      <Ionicons name="heart-outline" size={64} color={colors.textTertiary} />
      <Text style={styles.emptyFavoritesText}>Sin Favoritos</Text>
      <Text style={styles.emptyFavoritesSubtext}>
        Explora propiedades y marca las que más te gusten como favoritas
      </Text>
      <CustomButton
        title="Explorar Propiedades"
        onPress={() => navigation.navigate('PropertiesList')}
        variant="outline"
        size="small"
        style={styles.exploreButton}
      />
    </View>
  ), [navigation]);

  const getMenuItems = () => {
    const baseItems = [
      { 
        id: 'edit-profile', 
        title: 'Editar Perfil', 
        icon: 'person-outline', 
        action: () => navigation.navigate('EditProfile'),
        description: 'Actualiza tu información personal'
      },
      { 
        id: 'my-properties', 
        title: 'Mis Propiedades', 
        icon: 'home-outline', 
        action: () => navigation.navigate('MyProperties'),
        description: 'Gestiona tus inmuebles'
      },
      { 
        id: 'notifications', 
        title: 'Preferencias', 
        icon: 'notifications-outline', 
        action: () => navigation.navigate('PreferenciasGestion'),
        description: 'Configura tus notificaciones'
      },
      { 
        id: 'verification', 
        title: 'Solicitar Verificación', 
        icon: 'checkmark-circle-outline', 
        action: () => navigation.navigate('RequestVerification'),
        description: 'Verifica tu cuenta'
      },
      { 
        id: 'my-verifications', 
        title: 'Mis Verificaciones', 
        icon: 'shield-checkmark-outline', 
        action: () => navigation.navigate('VerificationRequestsList'),
        description: 'Estado de verificaciones'
      },
      { 
        id: 'transactions', 
        title: 'Ver Transacciones', 
        icon: 'card-outline', 
        action: () => navigation.navigate('TransactionsList'),
        description: 'Historial financiero'
      },
    ];

    if (profile?.role === 'AGENTE' || profile?.role === 'ADMIN') {
      baseItems.push(
        { 
          id: 'new-transaction', 
          title: 'Nueva Transacción', 
          icon: 'add-circle-outline', 
          action: () => navigation.navigate('TransactionForm'),
          description: 'Registrar nueva operación'
        },
        { 
          id: 'reports', 
          title: 'Reportes', 
          icon: 'analytics-outline', 
          action: () => navigation.navigate('TransactionReports'),
          description: 'Análisis y estadísticas'
        }
      );
    }

    if (profile?.role === 'ADMIN') {
      baseItems.push(
        { 
          id: 'admin-verification', 
          title: 'Gestión de Verificaciones', 
          icon: 'shield-outline', 
          action: () => navigation.navigate('AdminVerification'),
          description: 'Administrar verificaciones'
        },
        { 
          id: 'user-management', 
          title: 'Gestión de Usuarios', 
          icon: 'people-outline', 
          action: () => navigation.navigate('UsersList'),
          description: 'Administrar usuarios'
        }
      );
    }

    return baseItems;
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
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
    >
      {/* Profile Header */}
      <View style={styles.headerSection}>
        {profile ? (
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={40} color={colors.primary} />
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>
                  {profile.nombre || profile.name} {profile.apellido || ''}
                </Text>
                <Text style={styles.profileEmail}>{profile.email}</Text>
                {profile.telefono && (
                  <Text style={styles.profilePhone}>
                    <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                    {' '}{profile.telefono}
                  </Text>
                )}
              </View>
            </View>
            
            {profile.role && (
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(profile.role) + '20' }]}>
                <Ionicons 
                  name={getRoleIcon(profile.role) as any} 
                  size={16} 
                  color={getRoleColor(profile.role)} 
                />
                <Text style={[styles.roleText, { color: getRoleColor(profile.role) }]}>
                  {getRoleDisplayName(profile.role)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
            <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
          </View>
        )}
      </View>

      {/* Favorites Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="heart" size={24} color={colors.error} />
          <Text style={styles.sectionTitle}>Favoritos</Text>
          <Text style={styles.favoritesCount}>({favorites.length})</Text>
        </View>
        
        {favorites.length > 0 ? (
          <FlatList
            data={favorites}
            keyExtractor={item => item.id?.toString()}
            renderItem={renderFavorite}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={10}
          />
        ) : (
          renderEmptyFavorites
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        <View style={styles.menuContainer}>
          {getMenuItems().map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.logoutSection}>
        <CustomButton
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="error"
          size="large"
          leftIcon={<Ionicons name="log-out-outline" size={20} color={colors.textLight} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  headerSection: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },

  profileCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.xl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  profileDetails: {
    flex: 1,
  },

  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },

  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  profilePhone: {
    fontSize: 14,
    color: colors.textSecondary,
    alignItems: 'center',
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },

  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },

  errorCard: {
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },

  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    fontWeight: '500',
  },

  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  favoritesCount: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },

  favoriteCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.small,
  },

  favoriteContent: {
    marginBottom: spacing.sm,
  },

  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  favoriteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },

  favoriteLocation: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },

  favoritePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  favoriteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  favoriteActionButton: {
    flex: 1,
  },

  emptyFavoritesContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },

  emptyFavoritesText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  emptyFavoritesSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  exploreButton: {
    marginTop: spacing.sm,
  },

  menuContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  menuItemText: {
    flex: 1,
  },

  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },

  menuItemDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  logoutSection: {
    padding: spacing.xl,
    paddingTop: 0,
  },
});
