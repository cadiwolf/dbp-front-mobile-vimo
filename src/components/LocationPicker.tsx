import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { UbicacionGeografica, autocompleteAddress, geocodeAddress } from '../api/locations';

interface LocationPickerProps {
  onLocationSelect: (location: UbicacionGeografica) => void;
  placeholder?: string;
  initialValue?: string;
  style?: any;
  showCurrentLocationButton?: boolean;
}

export default function LocationPicker({
  onLocationSelect,
  placeholder = "Buscar dirección...",
  initialValue = "",
  style,
  showCurrentLocationButton = true,
}: LocationPickerProps) {
  const [input, setInput] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (input.length > 2) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(input);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input]);

  const fetchSuggestions = async (searchText: string) => {
    setLoading(true);
    try {
      const results = await autocompleteAddress(searchText);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = async (selectedAddress: string) => {
    setInput(selectedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    
    try {
      setLoading(true);
      const location = await geocodeAddress(selectedAddress);
      onLocationSelect(location);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación de esta dirección');
      console.error('Error geocoding address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = () => {
    if (input.trim().length > 5) {
      handleSuggestionSelect(input.trim());
    }
  };

  const getCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos requeridos', 'Se necesitan permisos de ubicación para usar esta función.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const currentLocation: UbicacionGeografica = {
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        direccionCompleta: 'Ubicación actual',
        pais: 'Perú',
        region: '',
        provincia: '',
        distrito: '',
        codigoPostal: '',
      };

      // Intentar obtener la dirección readable de las coordenadas
      try {
        const addressResults = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResults.length > 0) {
          const address = addressResults[0];
          currentLocation.direccionCompleta = [
            address.streetNumber,
            address.street,
            address.city,
            address.region,
            address.postalCode,
            address.country
          ].filter(Boolean).join(', ');
          currentLocation.distrito = address.city || '';
          currentLocation.provincia = address.subregion || '';
          currentLocation.region = address.region || '';
          currentLocation.pais = address.country || 'Perú';
          currentLocation.codigoPostal = address.postalCode || '';
        }
      } catch (error) {
        console.log('Error obteniendo dirección:', error);
      }

      setInput(currentLocation.direccionCompleta || 'Ubicación actual');
      onLocationSelect(currentLocation);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setGpsLoading(false);
    }
  };

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(item)}
    >
      <Text style={styles.suggestionText}>📍 {item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onSubmitEditing={handleManualInput}
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator
            style={styles.loadingIndicator}
            size="small"
            color="#007bff"
          />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={renderSuggestion}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {input.length > 5 && !showSuggestions && !loading && (
        <TouchableOpacity
          style={styles.manualButton}
          onPress={handleManualInput}
        >
          <Text style={styles.manualButtonText}>
            🔍 Buscar "{input}"
          </Text>
        </TouchableOpacity>
      )}

      {showCurrentLocationButton && (
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={getCurrentLocation}
          disabled={gpsLoading}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="locate-outline" size={16} color="#fff" />
          )}
          <Text style={styles.gpsButtonText}>
            {gpsLoading ? 'Obteniendo...' : 'Ubicación actual'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 15,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1001,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  manualButton: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  manualButtonText: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 6,
    marginTop: 10,
  },
  gpsButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
});
