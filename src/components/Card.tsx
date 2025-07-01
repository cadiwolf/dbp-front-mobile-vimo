import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';

export interface CardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'round';
  shadow?: boolean;
  bordered?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  badge?: React.ReactNode;
  loading?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  variant = 'default',
  size = 'medium',
  onPress,
  disabled = false,
  style,
  contentStyle,
  headerStyle,
  titleStyle,
  subtitleStyle,
  padding = 'medium',
  margin = 'none',
  borderRadius = 'medium',
  shadow = true,
  bordered = false,
  header,
  footer,
  leftContent,
  rightContent,
  badge,
  loading = false,
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.backgroundSecondary,
          shadowOpacity: 0.15,
          elevation: 8,
        };
      case 'outlined':
        return {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.backgroundTertiary,
        };
      case 'success':
        return {
          backgroundColor: colors.background,
          borderLeftWidth: 4,
          borderLeftColor: colors.success,
        };
      case 'warning':
        return {
          backgroundColor: colors.background,
          borderLeftWidth: 4,
          borderLeftColor: colors.warning,
        };
      case 'error':
        return {
          backgroundColor: colors.background,
          borderLeftWidth: 4,
          borderLeftColor: colors.error,
        };
      case 'info':
        return {
          backgroundColor: colors.background,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        };
      default:
        return {
          backgroundColor: colors.background,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: 60,
        };
      case 'large':
        return {
          minHeight: 150,
        };
      default:
        return {
          minHeight: 100,
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: 8 };
      case 'large':
        return { padding: 24 };
      default:
        return { padding: 16 };
    }
  };

  const getMarginStyles = () => {
    switch (margin) {
      case 'small':
        return { margin: 8 };
      case 'medium':
        return { margin: 12 };
      case 'large':
        return { margin: 16 };
      default:
        return { margin: 0 };
    }
  };

  const getBorderRadiusStyles = () => {
    switch (borderRadius) {
      case 'none':
        return { borderRadius: 0 };
      case 'small':
        return { borderRadius: 4 };
      case 'large':
        return { borderRadius: 16 };
      case 'round':
        return { borderRadius: 999 };
      default:
        return { borderRadius: 8 };
    }
  };

  const cardStyles = [
    styles.card,
    getVariantStyles(),
    getSizeStyles(),
    getMarginStyles(),
    getBorderRadiusStyles(),
    shadow && !bordered && styles.shadow,
    bordered && styles.bordered,
    disabled && styles.disabled,
    onPress && styles.pressable,
    style,
  ];

  const renderHeader = () => {
    if (!title && !subtitle && !header && !badge && !leftContent && !rightContent) {
      return null;
    }

    return (
      <View style={[styles.header, headerStyle]}>
        {(leftContent || title || subtitle) && (
          <View style={styles.headerLeft}>
            {leftContent}
            {(title || subtitle) && (
              <View style={styles.headerText}>
                {title && (
                  <Text style={[styles.title, titleStyle]} numberOfLines={2}>
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={2}>
                    {subtitle}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        
        {header && <View style={styles.customHeader}>{header}</View>}
        
        {(rightContent || badge) && (
          <View style={styles.headerRight}>
            {rightContent}
            {badge && <View style={styles.badge}>{badge}</View>}
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (!children) return null;

    return (
      <View style={[getPaddingStyles(), contentStyle]}>
        {children}
      </View>
    );
  };

  const renderFooter = () => {
    if (!footer) return null;

    return (
      <View style={styles.footer}>
        {footer}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[cardStyles, styles.loadingCard]}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingLine} />
          <View style={[styles.loadingLine, styles.loadingLineShort]} />
          <View style={[styles.loadingLine, styles.loadingLineMedium]} />
        </View>
      </View>
    );
  }

  return (
    <CardComponent
      style={cardStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  pressable: {
    // Add pressable styles if needed
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    marginLeft: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 12,
  },
  customHeader: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  badge: {
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Loading states
  loadingCard: {
    padding: 16,
  },
  loadingContent: {
    flex: 1,
  },
  loadingLine: {
    height: 12,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 6,
    marginBottom: 8,
  },
  loadingLineShort: {
    width: '60%',
  },
  loadingLineMedium: {
    width: '80%',
  },
});

export default Card;