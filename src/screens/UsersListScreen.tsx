import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  getAllUsers,
  getUsersByRole,
  searchUsersByName,
  getActiveUsers,
  deleteUser,
  UsuarioResponse,
  Roles,
  getFullName,
  getRoleDisplayName,
  getRoleColor,
  getRoleIcon,
} from '../api/users';
import { getUserProfile } from '../api/userProfile';
import { showApiErrorAlert } from '../utils/errorHandler';
import CustomButton from '../components/CustomButton';
import { useToast } from '../components/ToastProvider';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { RootStackParamList } from '../navigation/AppNavigator';

type UsersListNavigationProp = StackNavigationProp<RootStackParamList>;

export default function UsersListScreen() {
  const navigation = useNavigation<UsersListNavigationProp>();
  const { showSuccess, showError } = useToast();
  
  const [users, setUsers] = useState<UsuarioResponse[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UsuarioResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<Roles | 'TODOS'>('TODOS');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsuarioResponse | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const roles: Array<Roles | 'TODOS'> = ['TODOS', 'ADMIN', 'PROPIETARIO', 'AGENTE', 'CLIENTE'];

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUsers();
    }
  }, [currentUser, selectedRole, showActiveOnly]);

  useEffect(() => {
    filterUsers();
  }, [users, searchText]);

  const loadCurrentUser = async () => {
    try {
      const userProfile = await getUserProfile();
      setCurrentUser(userProfile);
      
      if (userProfile.role !== 'ADMIN') {
        Alert.alert(
          'Acceso Denegado',
          'Solo los administradores pueden acceder a esta sección',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información del usuario');
      navigation.goBack();
    }
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      let usersData: UsuarioResponse[] = [];

      if (showActiveOnly) {
        usersData = await getActiveUsers();
      } else if (selectedRole === 'TODOS') {
        usersData = await getAllUsers();
      } else {
        usersData = await getUsersByRole(selectedRole as Roles);
      }

      setUsers(usersData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      showError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [selectedRole, showActiveOnly, showError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadUsers();
      showSuccess('Lista de usuarios actualizada');
    } catch (error) {
      showError('Error al actualizar la lista');
    } finally {
      setRefreshing(false);
    }
  }, [loadUsers, showSuccess, showError]);

  const filterUsers = useCallback(() => {
    if (!searchText.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      getFullName(user).toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
    );
    
    setFilteredUsers(filtered);
  }, [searchText, users]);

  const handleUserPress = useCallback((user: UsuarioResponse) => {
    setSelectedUser(user);
    setShowUserModal(true);
  }, []);

  const handleEditUser = useCallback((user: UsuarioResponse) => {
    navigation.navigate('UserForm', { user });
  }, [navigation]);

  const handleCreateUser = useCallback(() => {
    navigation.navigate('UserForm');
  }, [navigation]);

  const handleDeleteUser = useCallback((user: UsuarioResponse) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar al usuario "${getFullName(user)}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => confirmDeleteUser(user.id)
        }
      ]
    );
  }, []);

  const confirmDeleteUser = useCallback(async (userId: number) => {
    try {
      await deleteUser(userId);
      showSuccess('Usuario eliminado exitosamente');
      loadUsers();
      setShowUserModal(false);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showError('Error al eliminar usuario');
    }
  }, [loadUsers, showSuccess, showError]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const FilterChip = ({ role, isActive, count }: { role: Roles | 'TODOS'; isActive: boolean; count: number }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        isActive && styles.filterChipActive
      ]}
      onPress={() => setSelectedRole(role)}
    >
      <Text style={[
        styles.filterChipText,
        isActive && styles.filterChipTextActive
      ]}>
        {role === 'TODOS' ? 'Todos' : getRoleDisplayName(role as Roles)} ({count})
      </Text>
    </TouchableOpacity>
  );

  const getUserCountByRole = (role: Roles | 'TODOS') => {
    if (role === 'TODOS') return users.length;
    return users.filter(user => user.rol === role).length;
  };

  const renderUser = useCallback(({ item }: { item: UsuarioResponse }) => (
    <TouchableOpacity
      style={[globalStyles.card, styles.userCard]}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{getFullName(item)}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.telefono && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.userPhone}>{item.telefono}</Text>
            </View>
          )}
        </View>
        <View style={styles.badgesContainer}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.rol) }]}>
            <Text style={styles.roleText}>{getRoleDisplayName(item.rol)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.activo ? colors.success : colors.error }
          ]}>
            <Ionicons 
              name={item.activo ? "checkmark-circle" : "close-circle"} 
              size={12} 
              color={colors.textLight} 
            />
            <Text style={styles.statusText}>
              {item.activo ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
          
          {(item.rol === 'AGENTE' || item.rol === 'PROPIETARIO') && (
            <View style={[
              styles.statusBadge, 
              { backgroundColor: item.verificado ? colors.info : colors.warning }
            ]}>
              <Ionicons 
                name={item.verificado ? "shield-checkmark" : "time"} 
                size={12} 
                color={colors.textLight} 
              />
              <Text style={styles.statusText}>
                {item.verificado ? 'Verificado' : 'Pendiente'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.metaInfo}>
          <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.userDate}>
            Registrado: {formatDate(item.creadoEn)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleUserPress, formatDate]);

  if (loading && users.length === 0) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.bodyTextSecondary, styles.loadingText]}>
          Cargando usuarios...
        </Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, globalStyles.safeArea]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={globalStyles.title}>Gestión de Usuarios</Text>
          <Text style={globalStyles.subtitle}>
            Administra usuarios del sistema
          </Text>
        </View>
        <CustomButton
          title="Nuevo"
          variant="primary"
          size="medium"
          onPress={handleCreateUser}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o email..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={colors.textTertiary}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros por rol */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filtrar por rol</Text>
          <View style={styles.filtersGrid}>
            {roles.map((role) => (
              <FilterChip
                key={role}
                role={role}
                isActive={selectedRole === role}
                count={getUserCountByRole(role)}
              />
            ))}
          </View>
        </View>

        {/* Toggle usuarios activos */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showActiveOnly && styles.toggleButtonActive
            ]}
            onPress={() => setShowActiveOnly(!showActiveOnly)}
          >
            <Ionicons 
              name={showActiveOnly ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={showActiveOnly ? colors.textLight : colors.textSecondary} 
            />
            <Text style={[
              styles.toggleText,
              showActiveOnly && styles.toggleTextActive
            ]}>
              Solo usuarios activos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats y contador */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredUsers.length}</Text>
            <Text style={styles.statLabel}>
              Usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {loading && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </View>

        {/* Lista de usuarios */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="people-outline" 
              size={64} 
              color={colors.textTertiary} 
              style={styles.emptyIcon}
            />
            <Text style={globalStyles.emptyState}>
              No se encontraron usuarios
            </Text>
            <Text style={globalStyles.bodyTextSecondary}>
              Intenta cambiar los filtros o el término de búsqueda
            </Text>
            <CustomButton
              title="Crear Primer Usuario"
              variant="primary"
              size="large"
              onPress={handleCreateUser}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUser}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </ScrollView>

      {/* Modal de detalles */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserModal(false)}
      >
        {selectedUser && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Usuario</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={[globalStyles.card, styles.userDetailCard]}>
                <Text style={styles.modalUserName}>{getFullName(selectedUser)}</Text>
                <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                
                <View style={styles.modalInfoSection}>
                  <Text style={styles.modalSectionTitle}>Información Personal</Text>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.modalInfoText}>{selectedUser.email}</Text>
                  </View>
                  {selectedUser.telefono && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.modalInfoText}>{selectedUser.telefono}</Text>
                    </View>
                  )}
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.modalInfoText}>{getRoleDisplayName(selectedUser.rol)}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.modalInfoText}>
                      Registrado: {formatDate(selectedUser.creadoEn)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfoSection}>
                  <Text style={styles.modalSectionTitle}>Estado</Text>
                  <View style={styles.modalInfoRow}>
                    <Ionicons 
                      name={selectedUser.activo ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={selectedUser.activo ? colors.success : colors.error} 
                    />
                    <Text style={[
                      styles.modalInfoText,
                      { color: selectedUser.activo ? colors.success : colors.error }
                    ]}>
                      {selectedUser.activo ? 'Usuario Activo' : 'Usuario Inactivo'}
                    </Text>
                  </View>
                  {(selectedUser.rol === 'AGENTE' || selectedUser.rol === 'PROPIETARIO') && (
                    <View style={styles.modalInfoRow}>
                      <Ionicons 
                        name={selectedUser.verificado ? "shield-checkmark" : "time"} 
                        size={16} 
                        color={selectedUser.verificado ? colors.info : colors.warning} 
                      />
                      <Text style={[
                        styles.modalInfoText,
                        { color: selectedUser.verificado ? colors.info : colors.warning }
                      ]}>
                        {selectedUser.verificado ? 'Verificado' : 'Verificación Pendiente'}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedUser.documentoVerificacion && (
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalSectionTitle}>Verificación</Text>
                    <View style={styles.modalInfoRow}>
                      <Ionicons name="document-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.modalInfoText}>
                        Documento: {selectedUser.documentoVerificacion}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <CustomButton
                title="Editar Usuario"
                variant="primary"
                size="large"
                onPress={() => {
                  setShowUserModal(false);
                  handleEditUser(selectedUser);
                }}
                style={styles.modalButton}
              />
              <CustomButton
                title="Eliminar Usuario"
                variant="error"
                size="large"
                onPress={() => handleDeleteUser(selectedUser)}
                style={styles.modalButton}
              />
              <CustomButton
                title="Cerrar"
                variant="secondary"
                size="large"
                onPress={() => setShowUserModal(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.textLight,
  },
  toggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  toggleTextActive: {
    color: colors.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  badgesContainer: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  userDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 24,
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
  userDetailCard: {
    marginBottom: 20,
  },
  modalUserName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalUserEmail: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modalInfoSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 12,
    lineHeight: 20,
  },
  modalActions: {
    padding: 20,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    marginBottom: 12,
  },
});
