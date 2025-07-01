import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Text } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PropertiesListScreen from '../screens/PropertiesListScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import ScheduleVisitScreen from '../screens/ScheduleVisitScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatsListScreen from '../screens/ChatsListScreen';
import PreferenciasGestionScreen from '../screens/PreferenciasGestionScreen';
import MyPropertiesScreen from '../screens/MyPropertiesScreen';
import PropertyFormScreen from '../screens/PropertyFormScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ReservationsListScreen from '../screens/ReservationsListScreen';
import ReservationDetailScreen from '../screens/ReservationDetailScreen';
import EditReservationScreen from '../screens/EditReservationScreen';
import RequestVerificationScreen from '../screens/RequestVerificationScreen';
import VerificationRequestsListScreen from '../screens/VerificationRequestsListScreen';
import AdminVerificationScreen from '../screens/AdminVerificationScreen';
import TransactionFormScreen from '../screens/TransactionFormScreen';
import TransactionsListScreen from '../screens/TransactionsListScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import TransactionReportsScreen from '../screens/TransactionReportsScreen';
import LocationSearchScreen from '../screens/LocationSearchScreen';
import UsersListScreen from '../screens/UsersListScreen';
import UserFormScreen from '../screens/UserFormScreen';


const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Tipos para las props de navegación
export type RootStackParamList = {
  Register: undefined;
  Login: undefined;
  Main: undefined;
  Home: undefined;
  Profile: undefined;
  PropertiesList: undefined;
  MyProperties: undefined;
  PropertyForm: { property?: any; userId?: number } | undefined;
  PropertyDetail: { id: number };
  ScheduleVisit: { propertyId: string };
  Chat: {
    remitenteId: number;
    destinatarioId: number;
    agenteId: number;
    propiedadId: number;
    titulo: string;
  };
  Notifications: undefined;
  PreferenciasGestion: undefined;
  EditProfile: undefined;
  ReservationsList: { userId: number; userRole?: string };
  ReservationDetail: { id: number };
  EditReservation: { id: number };
  RequestVerification: undefined;
  VerificationRequestsList: undefined;
  AdminVerification: undefined;
  TransactionForm: { propiedadId?: number } | undefined;
  TransactionsList: undefined;
  TransactionDetail: { id: number };
  TransactionReports: undefined;
  LocationSearch: undefined;
  UsersList: undefined;
  UserForm: { user?: any } | undefined;
  SensorDemo: undefined;
};
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
export type RegisterScreenRouteProp = RouteProp<RootStackParamList, 'Register'>;
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
export type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;
export type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;
export type PropertiesListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PropertiesList'>;
export type PropertiesListScreenRouteProp = RouteProp<RootStackParamList, 'PropertiesList'>;
export type PropertyDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PropertyDetail'>;
export type PropertyDetailScreenRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>;
export type ScheduleVisitScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ScheduleVisit'>;
export type ScheduleVisitScreenRouteProp = RouteProp<RootStackParamList, 'ScheduleVisit'>;

function VimoHeaderTitle() {
  return (
    <React.Fragment>
      <span style={{ fontWeight: 'bold', fontSize: 20, color: '#007bff', marginRight: 16 }}>VIMO</span>
    </React.Fragment>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'PropertiesList') iconName = 'search-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';
          else if (route.name === 'ChatsList') iconName = 'chatbubble-ellipses-outline';
          else if (route.name === 'Notifications') iconName = 'notifications-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        headerRight: () => (
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#007bff', marginRight: 16 }}>VIMO</Text>
        ),
        headerShown: true,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="PropertiesList" component={PropertiesListScreen} options={{ title: 'Buscar' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
      <Tab.Screen name="ChatsList" component={ChatsListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
    </Tab.Navigator>
  );
}

// Deep linking config
const linking = {
  prefixes: ['vimo://', 'https://vimo.com'],
  config: {
    screens: {
      Main: 'main',
      PropertyDetail: 'propiedad/:id',
      MyProperties: 'mis-propiedades',
      PreferenciasGestion: 'preferencias',
      ReservationsList: 'reservas',
      ReservationDetail: 'reserva/:id',
      EditReservation: 'editar-reserva/:id',
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking} theme={DefaultTheme}>
      <Stack.Navigator initialRouteName="Register">
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="MyProperties" component={MyPropertiesScreen} options={{ title: 'Mis Propiedades', headerShown: true }} />
        <Stack.Screen name="PropertyForm" component={PropertyFormScreen} options={{ title: 'Propiedad', headerShown: true }} />
        <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Detalle de Propiedad', headerShown: true }} />
        <Stack.Screen name="ScheduleVisit" component={ScheduleVisitScreen} options={{ title: 'Agendar Visita', headerShown: true }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat', headerShown: true }} />
        <Stack.Screen name="PreferenciasGestion" component={PreferenciasGestionScreen} options={{ title: 'Preferencias de Notificación', headerShown: true }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Editar Perfil', headerShown: true }} />
        <Stack.Screen name="ReservationsList" component={ReservationsListScreen} options={{ title: 'Lista de Reservas', headerShown: true }} />
        <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} options={{ title: 'Detalle de Reserva', headerShown: true }} />
        <Stack.Screen name="EditReservation" component={EditReservationScreen} options={{ title: 'Editar Reserva', headerShown: true }} />
        <Stack.Screen name="RequestVerification" component={RequestVerificationScreen} options={{ title: 'Solicitar Verificación', headerShown: true }} />
        <Stack.Screen name="VerificationRequestsList" component={VerificationRequestsListScreen} options={{ title: 'Mis Verificaciones', headerShown: true }} />
        <Stack.Screen name="AdminVerification" component={AdminVerificationScreen} options={{ title: 'Gestión de Verificaciones', headerShown: true }} />
        <Stack.Screen name="TransactionForm" component={TransactionFormScreen} options={{ title: 'Nueva Transacción', headerShown: true }} />
        <Stack.Screen name="TransactionsList" component={TransactionsListScreen} options={{ title: 'Transacciones', headerShown: true }} />
        <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} options={{ title: 'Detalle de Transacción', headerShown: true }} />
        <Stack.Screen name="TransactionReports" component={TransactionReportsScreen} options={{ title: 'Reportes de Transacciones', headerShown: true }} />
        <Stack.Screen name="LocationSearch" component={LocationSearchScreen} options={{ title: 'Buscar por Ubicación', headerShown: true }} />
        <Stack.Screen name="UsersList" component={UsersListScreen} options={{ title: 'Gestión de Usuarios', headerShown: true }} />
        <Stack.Screen name="UserForm" component={UserFormScreen} options={{ title: 'Formulario de Usuario', headerShown: true }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
