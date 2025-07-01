// 🗺️ SENSOR 2: DEVICE MOTION / ORIENTATION
// Componente para usar sensores de movimiento del dispositivo
// Relevante para mejorar la experiencia de mapas y navegación

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

interface DeviceOrientationProps {
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
  onShakeDetected?: () => void;
}

export default function DeviceOrientationSensor({ 
  onOrientationChange, 
  onShakeDetected 
}: DeviceOrientationProps) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [motionData, setMotionData] = useState<any>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    // Configurar listener del sensor de movimiento
    _subscribe();
    
    return () => _unsubscribe();
  }, []);

  const _subscribe = () => {
    // Configurar la frecuencia de actualización
    DeviceMotion.setUpdateInterval(100); // 100ms

    const sub = DeviceMotion.addListener((data) => {
      setMotionData(data);
      
      // Detectar orientación basada en la gravedad
      if (data.acceleration) {
        const { x, y } = data.acceleration;
        const newOrientation = Math.abs(x) > Math.abs(y) ? 'landscape' : 'portrait';
        
        if (newOrientation !== orientation) {
          setOrientation(newOrientation);
          onOrientationChange?.(newOrientation);
        }
      }

      // Detectar sacudida del dispositivo
      if (data.accelerationIncludingGravity) {
        const { x, y, z } = data.accelerationIncludingGravity;
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        // Umbral para detectar sacudida (ajustar según necesidad)
        const shakeThreshold = 15;
        
        if (acceleration > shakeThreshold && !isShaking) {
          setIsShaking(true);
          onShakeDetected?.();
          
          // Resetear después de 1 segundo para evitar múltiples detecciones
          setTimeout(() => setIsShaking(false), 1000);
        }
      }
    });

    setSubscription(sub);
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const getOrientationIcon = () => {
    return orientation === 'portrait' ? '📱' : '📲';
  };

  const getOrientationText = () => {
    return orientation === 'portrait' ? 'Vertical' : 'Horizontal';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Sensor de Orientación</Text>
      
      <View style={styles.orientationContainer}>
        <Text style={styles.orientationIcon}>{getOrientationIcon()}</Text>
        <Text style={styles.orientationText}>
          Orientación: {getOrientationText()}
        </Text>
      </View>

      {isShaking && (
        <View style={styles.shakeIndicator}>
          <Text style={styles.shakeText}>🔄 Dispositivo sacudido!</Text>
        </View>
      )}

      {motionData && (
        <View style={styles.motionData}>
          <Text style={styles.dataTitle}>Datos del Sensor:</Text>
          {motionData.acceleration && (
            <Text style={styles.dataText}>
              Aceleración: X: {motionData.acceleration.x?.toFixed(2)}, 
              Y: {motionData.acceleration.y?.toFixed(2)}, 
              Z: {motionData.acceleration.z?.toFixed(2)}
            </Text>
          )}
          {motionData.rotation && (
            <Text style={styles.dataText}>
              Rotación: α: {motionData.rotation.alpha?.toFixed(2)}, 
              β: {motionData.rotation.beta?.toFixed(2)}, 
              γ: {motionData.rotation.gamma?.toFixed(2)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  orientationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  orientationIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  orientationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  shakeIndicator: {
    backgroundColor: '#ffc107',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  shakeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  motionData: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  dataText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});
