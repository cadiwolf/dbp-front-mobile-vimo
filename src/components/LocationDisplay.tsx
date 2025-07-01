import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { UbicacionGeografica, formatAddress, hasValidCoordinates } from '../api/locations';

interface LocationDisplayProps {
  location: UbicacionGeografica;
  showDetails?: boolean;
  onPress?: () => void;
  style?: any;
}

export default function LocationDisplay({
  location,
  showDetails = false,
  onPress,
  style,
}: LocationDisplayProps) {
  const openMaps = () => {
    if (hasValidCoordinates(location)) {
      const url = `https://www.google.com/maps/search/?api=1&query=${location.latitud},${location.longitud}`;
      Linking.openURL(url);
    } else if (location.direccionCompleta) {
      const query = encodeURIComponent(location.direccionCompleta);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(url);
    }
  };

  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { onPress } : {};

  return (
    <Container style={[styles.container, style]} {...containerProps}>
      <View style={styles.header}>
        <Text style={styles.icon}>📍</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.mainAddress}>
            {formatAddress(location)}
          </Text>
          {showDetails && location.direccionCompleta && (
            <Text style={styles.details}>
              {location.direccionCompleta}
            </Text>
          )}
        </View>
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          {location.distrito && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distrito:</Text>
              <Text style={styles.detailValue}>{location.distrito}</Text>
            </View>
          )}
          
          {location.provincia && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provincia:</Text>
              <Text style={styles.detailValue}>{location.provincia}</Text>
            </View>
          )}
          
          {location.region && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Región:</Text>
              <Text style={styles.detailValue}>{location.region}</Text>
            </View>
          )}

          {location.codigoPostal && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Código Postal:</Text>
              <Text style={styles.detailValue}>{location.codigoPostal}</Text>
            </View>
          )}

          {hasValidCoordinates(location) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coordenadas:</Text>
              <Text style={styles.detailValue}>
                {location.latitud?.toFixed(6)}, {location.longitud?.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      )}

      {(hasValidCoordinates(location) || location.direccionCompleta) && (
        <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
          <Text style={styles.mapsButtonText}>🗺️ Ver en Google Maps</Text>
        </TouchableOpacity>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  addressContainer: {
    flex: 1,
  },
  mainAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  detailsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  mapsButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  mapsButtonText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
});
