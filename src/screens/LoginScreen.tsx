import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  StatusBar,
  Linking, // Importar Linking
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../types/navigation";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { FontAwesome } from "@expo/vector-icons";
import { login as apiLogin } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";

type NavigationProp = NativeStackNavigationProp<AppStackParamList, "Login">;

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();

  const handleLogin = async (): Promise<void> => {
    setErrorMessage("");
    
    if (!email || !password) {
      const message = "Por favor, completa todos los campos.";
      if (Platform.OS === "web") {
        setErrorMessage(message);
      } else {
        Alert.alert("Error", message);
      }
      return;
    }

    setIsLoading(true);
    
    try {
      // Llamar a la API de login
      const response = await apiLogin(email, password);
      
      // Verificar si el login fue exitoso y obtener el rol
      if (response && response.usuario) {
        const { rol } = response.usuario;
        
        // Llamar al login del contexto con el rol correcto
        login(rol);
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (error: any) {
      setIsLoading(false);
      
      // Manejar errores de la API
      const errorMessage = error.message || "Error de conexión. Inténtalo nuevamente.";
      
      if (Platform.OS === "web") {
        setErrorMessage(errorMessage);
      } else {
        Alert.alert("Error", errorMessage);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header con Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require("../assets/images/logo_omd.png")} 
            style={styles.logoPlaceholder}
          />
        </View>
      </View>

      {/* Card de Login */}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.title}>Iniciar sesión</Text>
          {/* Mensaje de Error (Web) */}
          {Platform.OS === "web" && errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : null}

          {/* Input de Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@correo.cl"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {/* Input de Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />
          </View>

          {/* Botón de Login */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          © Unidad de Deportes {new Date().getFullYear()}
        </Text>
        <View style={styles.socialIconsContainer}>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.facebook.com/angolomd/?locale=es_LA")}>
            <FontAwesome name="facebook-square" size={24} color="#fff" style={styles.socialIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://www.instagram.com/oficina.deportes.angol/?hl=es")}>
            <FontAwesome name="instagram" size={24} color="#fff" style={styles.socialIcon} />
          </TouchableOpacity>
        </View>
        <Text style={styles.addressText}>Andres Bello 256, Angol, Chile 4650000</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02A100",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#02A100",
  },
  title: {
    fontSize: 26,
    color: "#363636ff",
    fontWeight: "bold",
    marginBottom: 1,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#424242ff",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  },
  cardContent: {
    gap: 20,
  },
  errorMessage: {
    color: "#d32f2f",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#007F00",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    elevation: Platform.OS === "android" ? 2 : 0,
  },
  buttonDisabled: {
    backgroundColor: "#a0a0a0",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerContainer: {
    marginTop: 40,
    alignItems: "center",
    opacity: 0.8,
  },
  footerText: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 10,
  },
  socialIconsContainer: {
    flexDirection: "row",
    gap: 15,
  },
  socialIcon: {
    marginHorizontal: 5,
  },
  addressText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
    opacity: 0.7,
  },
});
