import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../types/navigation";
import { useNavigation } from "@react-navigation/native";

type NavigationProp = NativeStackNavigationProp<AppStackParamList, "Login">;

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigation = useNavigation<NavigationProp>();

  const handleLogin = (): void => {
    if (!email || !password) {
      if (Platform.OS === "web") {
        setErrorMessage("Por favor, completa todos los campos.");
      } else {
        Alert.alert("Error", "Por favor, completa todos los campos.");
      }
      return;
    }

    // Simulación simple de roles
    if (email === "admin@municipio.cl" && password === "1234") {
      navigation.replace("DashboardAdmin");
    } else if (email === "profesor@municipio.cl" && password === "1234") {
      navigation.replace("DashboardProfesor");
    } else {
      if (Platform.OS === "web") {
        setErrorMessage("Credenciales incorrectas");
      } else {
        Alert.alert("Error", "Credenciales incorrectas");
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Municipalidad Deportes</Text>
      <Text style={styles.subtitle}>Inicio de Sesión</Text>

      {Platform.OS === "web" && errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#ccc"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#ccc"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2025 Municipalidad de Deportes</Text>
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
  title: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#e0f2e9",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#007F00",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    elevation: Platform.OS === "android" ? 4 : 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    color: "#fff",
    fontSize: 12,
    marginTop: 40,
  },
  errorMessage: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
});
