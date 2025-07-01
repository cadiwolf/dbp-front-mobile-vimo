import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { globalStyles, spacing } from '../styles/globalStyles';

interface InputFieldProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  disabled?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

export default function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  disabled = false,
  required = false,
  containerStyle,
  inputStyle,
  labelStyle,
  variant = 'outlined',
  size = 'medium',
  ...textInputProps
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getContainerStyle = () => [
    styles.container,
    containerStyle,
  ];

  const getInputContainerStyle = () => [
    styles.inputContainer,
    styles[variant],
    styles[size],
    isFocused && styles.focused,
    error && styles.error,
    disabled && styles.disabled,
  ];

  const getInputStyle = () => [
    styles.input,
    styles[`${size}Input`],
    disabled && styles.inputDisabled,
    inputStyle,
  ];

  const getLabelStyle = () => [
    styles.label,
    styles[`${size}Label`],
    error && styles.labelError,
    disabled && styles.labelDisabled,
    labelStyle,
  ];

  return (
    <View style={getContainerStyle()}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={isFocused ? colors.primary : colors.textTertiary}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          editable={!disabled}
          {...textInputProps}
        />
        
        {isPassword && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
          >
            <Ionicons
              name={rightIcon as any}
              size={20}
              color={isFocused ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={error ? styles.errorText : styles.helperText}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },

  // Labels
  label: {
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  smallLabel: {
    fontSize: 12,
  },
  mediumLabel: {
    fontSize: 14,
  },
  largeLabel: {
    fontSize: 16,
  },
  labelError: {
    color: colors.error,
  },
  labelDisabled: {
    color: colors.textTertiary,
  },
  required: {
    color: colors.error,
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.background,
  },

  // Variants
  default: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'transparent',
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  // Sizes
  small: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  medium: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  large: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },

  // States
  focused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  error: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  disabled: {
    backgroundColor: colors.backgroundTertiary,
    borderColor: colors.borderLight,
    opacity: 0.6,
  },

  // Input
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '400',
  },
  smallInput: {
    fontSize: 14,
  },
  mediumInput: {
    fontSize: 16,
  },
  largeInput: {
    fontSize: 18,
  },
  inputDisabled: {
    color: colors.textTertiary,
  },

  // Icons
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },

  // Helper texts
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: '400',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '400',
  },
});