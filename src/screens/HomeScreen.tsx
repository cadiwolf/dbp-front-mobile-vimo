import React, { useEffect, useLayoutEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../utils/token';
import { getUserProfile } from '../api/userProfile';
import type { HomeScreenNavigationProp } from '../navigation/AppNavigator';
import CustomButton from '../components/CustomButton';
import { colors } from '../styles/colors';
import { globalStyles, spacing, shadows } from '../styles/globalStyles';

interface Props {
  navigation: HomeScreenNavigationProp;
}

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen({ navigation }: Props) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      const token = await getToken();
      if (!token) {
        navigation.replace('Login');
        return;
      }
      
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.log('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndLoadProfile();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.headerLogo}>VIMO</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')} 
            style={styles.headerButton}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'properties':
        navigation.navigate('PropertiesList');
        break;
      case 'myProperties':
        navigation.navigate('MyProperties');
        break;
      case 'location':
        navigation.navigate('LocationSearch');
        break;
      case 'transactions':
        navigation.navigate('TransactionsList');
        break;
      case 'chat':
        navigation.navigate('Notifications');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      default:
        break;
    }
  };

  const quickActions = [
    {
      id: 'properties',
      title: 'Buscar Propiedades',
      subtitle: 'Explora nuestro catálogo',
      icon: 'home-outline',
      color: colors.primary,
      variant: 'primary' as const,
    },
    {
      id: 'myProperties',
      title: 'Mis Propiedades',
      subtitle: 'Gestiona tus inmuebles',
      icon: 'business-outline',
      color: colors.info,
      variant: 'secondary' as const,
    },
    {
      id: 'location',
      title: 'Buscar por Ubicación',
      subtitle: 'Encuentra por zona',
      icon: 'location-outline',
      color: colors.success,
      variant: 'outline' as const,
    },
    {
      id: 'transactions',
      title: 'Transacciones',
      subtitle: 'Historial y reportes',
      icon: 'card-outline',
      color: colors.warning,
      variant: 'secondary' as const,
    },
  ];

  const secondaryActions = [
    { id: 'chat', title: 'Notificaciones', icon: 'notifications-outline' },
    { id: 'profile', title: 'Mi Perfil', icon: 'person-outline' },
  ];

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {userProfile?.nombre ? `${userProfile.nombre} ${userProfile.apellido || ''}` : 'Usuario'}
          </Text>
          <Text style={styles.tagline}>Plataforma Inmobiliaria Empresarial</Text>
        </View>
        
        {userProfile?.role && (
          <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={styles.roleText}>
              {userProfile.role === 'ADMIN' ? 'Administrador' :
               userProfile.role === 'AGENTE' ? 'Agente' :
               userProfile.role === 'PROPIETARIO' ? 'Propietario' : 'Cliente'}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions Grid */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Acciones Principales</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleQuickAction(action.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Secondary Actions */}
      <View style={styles.secondarySection}>
        <Text style={styles.sectionTitle}>Otras Opciones</Text>
        <View style={styles.secondaryGrid}>
          {secondaryActions.map((action) => (
            <CustomButton
              key={action.id}
              title={action.title}
              onPress={() => handleQuickAction(action.id)}
              variant="ghost"
              size="medium"
              leftIcon={<Ionicons name={action.icon as any} size={20} color={colors.primary} />}
              style={styles.secondaryButton}
            />
          ))}
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Gestiona todas tus actividades inmobiliarias desde una sola plataforma
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    gap: spacing.sm,
  },

  headerLogo: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.primary,
    letterSpacing: 1,
  },

  headerButton: {
    padding: spacing.xs,
  },

  headerSection: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },

  welcomeContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '400',
    marginBottom: spacing.xs,
  },

  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  tagline: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
  },

  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },

  actionsSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },

  actionCard: {
    width: (screenWidth - spacing.xl * 2 - spacing.md) / 2,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.medium,
  },

  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  actionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  secondarySection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  secondaryGrid: {
    gap: spacing.sm,
  },

  secondaryButton: {
    justifyContent: 'flex-start',
  },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
