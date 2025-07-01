import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { colors } from '../styles/colors';
import { globalStyles, shadows } from '../styles/globalStyles';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function CustomButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style = {},
  textStyle = {},
  variant = 'primary',
  size = 'medium',
  fullWidth = true,
  leftIcon,
  rightIcon,
}: CustomButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {leftIcon && !loading && leftIcon}
      
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.textPrimary : colors.primary} 
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
      
      {rightIcon && !loading && rightIcon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Base button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
    ...shadows.medium,
  },

  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },

  // Width
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...shadows.small,
  },
  success: {
    backgroundColor: colors.success,
    borderWidth: 0,
  },
  warning: {
    backgroundColor: colors.warning,
    borderWidth: 0,
  },
  error: {
    backgroundColor: colors.error,
    borderWidth: 0,
  },

  // Text variants
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: colors.textPrimary,
  },
  secondaryText: {
    color: colors.textSecondary,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  successText: {
    color: colors.textLight,
  },
  warningText: {
    color: colors.textLight,
  },
  errorText: {
    color: colors.textLight,
  },

  // Text sizes
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // States
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
});
