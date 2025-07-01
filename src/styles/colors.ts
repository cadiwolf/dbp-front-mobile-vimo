/**
 * VIMO - Paleta de Colores
 * Diseño minimalista y empresarial
 */

export const colors = {
  // Colores principales
  primary: '#A8DADC',        // Azul pastel principal
  primaryDark: '#81C4C8',    // Azul pastel oscuro (hover/pressed)
  primaryLight: '#D4ECEE',   // Azul pastel claro
  
  // Fondos
  background: '#FFFFFF',      // Fondo principal blanco
  backgroundSecondary: '#F7FAFC', // Fondo secundario gris muy claro
  backgroundTertiary: '#EDF2F7',  // Fondo terciario
  
  // Textos
  textPrimary: '#2D3748',     // Texto principal oscuro
  textSecondary: '#718096',   // Texto secundario gris medio
  textTertiary: '#A0AEC0',    // Texto terciario gris claro
  textLight: '#FFFFFF',       // Texto blanco
  
  // Bordes y separadores
  border: '#E2E8F0',         // Bordes principales
  borderLight: '#F1F5F9',    // Bordes claros
  divider: '#EDF2F7',        // Líneas divisorias
  
  // Estados y feedback
  success: '#48BB78',        // Verde éxito
  successLight: '#C6F6D5',   // Verde claro
  
  warning: '#ED8936',        // Naranja advertencia
  warningLight: '#FED7AA',   // Naranja claro
  
  error: '#F56565',          // Rojo error
  errorLight: '#FED7D7',     // Rojo claro
  
  info: '#4299E1',           // Azul información
  infoLight: '#BEE3F8',      // Azul claro
  
  // Colores de navegación
  tabActive: '#A8DADC',      // Tab activo
  tabInactive: '#718096',    // Tab inactivo
  
  // Sombras
  shadow: 'rgba(0, 0, 0, 0.1)',     // Sombra principal
  shadowLight: 'rgba(0, 0, 0, 0.05)', // Sombra suave
  shadowDark: 'rgba(0, 0, 0, 0.15)',  // Sombra oscura
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',     // Overlay modal
  overlayLight: 'rgba(0, 0, 0, 0.3)', // Overlay suave
};

// Alias para compatibilidad con código existente
export const Colors = colors;

// Colores temáticos específicos para VIMO
export const vimoTheme = {
  brand: colors.primary,
  accent: colors.primaryDark,
  neutral: colors.textSecondary,
  surface: colors.background,
  surfaceVariant: colors.backgroundSecondary,
};

// Gradientes empresariales
export const gradients = {
  primary: ['#A8DADC', '#81C4C8'],
  subtle: ['#F7FAFC', '#EDF2F7'],
  success: ['#48BB78', '#38A169'],
  warning: ['#ED8936', '#DD6B20'],
  error: ['#F56565', '#E53E3E'],
};

export default colors;