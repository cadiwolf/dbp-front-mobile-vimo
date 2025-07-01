import { StyleSheet, Dimensions } from 'react-native';
import { colors } from './colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * VIMO - Estilos Globales
 * Diseño minimalista y empresarial
 */

export const globalStyles = StyleSheet.create({
  // ====== CONTENEDORES BASE ======
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },

  // ====== CARDS Y SECCIONES ======
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  section: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // ====== TIPOGRAFÍA ======
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },

  subheading: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },

  bodyText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 24,
  },

  bodyTextSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },

  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textTertiary,
    lineHeight: 16,
  },

  // ====== BOTONES BASE ======
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  buttonSecondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },

  buttonSecondaryText: {
    color: colors.textSecondary,
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },

  buttonOutlineText: {
    color: colors.primary,
  },

  buttonSmall: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 40,
  },

  buttonLarge: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 56,
  },

  // ====== INPUTS Y FORMULARIOS ======
  inputContainer: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 48,
  },

  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },

  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // ====== LISTAS ======
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  listItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  listItemPressed: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.primary,
  },

  // ====== ESTADOS ======
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },

  // ====== NAVEGACIÓN ======
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  tabBarStyle: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    height: 60,
    paddingBottom: 8,
  },

  // ====== SEPARADORES ======
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },

  spacer: {
    height: 16,
  },

  spacerLarge: {
    height: 32,
  },

  // ====== BADGES Y ETIQUETAS ======
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  badgeSuccess: {
    backgroundColor: colors.success,
  },

  badgeWarning: {
    backgroundColor: colors.warning,
  },

  badgeError: {
    backgroundColor: colors.error,
  },

  // ====== LAYOUT HELPERS ======
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  column: {
    flexDirection: 'column',
  },

  flex1: {
    flex: 1,
  },

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ====== ESPACIADO ======
  paddingHorizontal: {
    paddingHorizontal: 20,
  },

  paddingVertical: {
    paddingVertical: 16,
  },

  margin: {
    margin: 16,
  },

  marginBottom: {
    marginBottom: 16,
  },

  marginTop: {
    marginTop: 16,
  },
});

// Constantes de espaciado
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Constantes de radius
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
};

// Constantes de sombras
export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Dimensiones útiles
export const dimensions = {
  screenWidth,
  screenHeight,
  headerHeight: 60,
  tabBarHeight: 60,
  buttonHeight: 48,
  inputHeight: 48,
};

export default globalStyles;