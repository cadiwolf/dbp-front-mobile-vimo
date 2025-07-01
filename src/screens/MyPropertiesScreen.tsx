import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import { useToast } from '../components/ToastProvider';
import {
  getPropertiesByOwner,
  deleteProperty,
  PropertyResponse
} from '../api/properties';
import { getToken } from '../utils/token';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

export default function MyPropertiesScreen({ navigation, route }: any) {
  // Simula obtener el usuario autenticado (ajusta según tu auth real)
  const userId = 1;
  const [properties, setProperties] = useState<PropertyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const { showSuccess, showError } = useToast();

  const cargarPropiedades = useCallback(async () => {
    try {
      const data = await getPropertiesByOwner(userId);
      setProperties(data);
    } catch {
      showError('No se pudieron cargar las propiedades');
    }
  }, [userId, showError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await cargarPropiedades();
      showSuccess('Propiedades actualizadas');
    } catch (e) {
      showError('Error al actualizar propiedades');
    } finally {
      setRefreshing(false);
    }
  }, [cargarPropiedades, showSuccess, showError]);

  useEffect(() => {
    const checkAuthAndSubscribe = async () => {
      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
        return;
      }
      setLoading(true);
      await cargarPropiedades();
      setLoading(false);
      
      const unsubscribe = navigation.addListener('focus', () => {
        if (!loading && !refreshing) {
          cargarPropiedades();
        }
      });
      return unsubscribe;
    };
    checkAuthAndSubscribe();
  }, [navigation, cargarPropiedades, loading, refreshing]);

  const handleEliminar = useCallback(async (id: number) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta propiedad? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: async () => {
            setLoadingDelete(true);
            try {
              await deleteProperty(id);
              showSuccess('Propiedad eliminada correctamente');
              cargarPropiedades();
            } catch {
              showError('No se pudo eliminar la propiedad. Intenta de nuevo.');
            } finally {
              setLoadingDelete(false);
            }
          }
        }
      ]
    );
  }, [cargarPropiedades, showSuccess, showError]);

  const handleEditar = useCallback((property: PropertyResponse) => {
    navigation.navigate('PropertyForm', { property, userId });
  }, [navigation, userId]);

  const handleDetalle = useCallback((id: number) => {
    navigation.navigate('PropertyDetail', { id });
  }, [navigation]);

  const renderPropertyCard = ({ item }: { item: PropertyResponse }) => (
    <TouchableOpacity 
      style={styles.propertyCard} 
      onPress={() => handleDetalle(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={styles.propertyHeader}>
          <View style={styles.propertyTitleContainer}>
            <Text style={styles.propertyTitle} numberOfLines={2}>
              {item.titulo}
            </Text>
            <View style={styles.propertyBadge}>
              <Ionicons name="home" size={12} color={colors.primary} />
              <Text style={styles.badgeText}>Activa</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.propertyDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.direccion}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="wallet-outline" size={16} color={colors.success} />
            <Text style={styles.priceText}>
              ${item.precio?.toLocaleString() || 'No especificado'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editAction]}
          onPress={() => handleEditar(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
          <Text style={styles.editActionText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteAction]}
          onPress={() => handleEliminar(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={styles.deleteActionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="home-outline" size={80} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No tienes propiedades</Text>
      <Text style={styles.emptySubtitle}>
        Comienza agregando tu primera propiedad para gestionar tu portafolio inmobiliario
      </Text>
      <CustomButton
        title="Agregar Primera Propiedad"
        onPress={() => navigation.navigate('PropertyForm', { userId })}
        variant="primary"
        size="medium"
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mis Propiedades</Text>
          <Text style={styles.subtitle}>
            {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
          </Text>
        </View>
        
        <CustomButton
          title="Nueva Propiedad"
          onPress={() => navigation.navigate('PropertyForm', { userId })}
          variant="primary"
          size="small"
          style={styles.newButton}
        />
      </View>

      {/* Loading States */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando propiedades...</Text>
        </View>
      )}
      
      {loadingDelete && (
        <View style={styles.overlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.error} />
            <Text style={styles.loadingText}>Eliminando propiedad...</Text>
          </View>
        </View>
      )}
      
      {/* Properties List */}
      {!loading && !loadingDelete && (
        <FlatList
          data={properties}
          keyExtractor={item => item.id.toString()}
          renderItem={renderPropertyCard}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="Actualizando..."
              titleColor={colors.textSecondary}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header Styles
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  newButton: {
    alignSelf: 'flex-end',
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: colors.background,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },

  // List Styles
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },

  // Property Card Styles
  propertyCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 20,
  },
  propertyHeader: {
    marginBottom: 16,
  },
  propertyTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },

  // Property Details
  propertyDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    color: colors.success,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Card Actions
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  editAction: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  deleteAction: {
    // No additional styles needed
  },
  editActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    minWidth: 200,
  },
});
