import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
  DrawerItem,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const navigation = useNavigation();

  const handleLogout = () => {
    // Navegar al login
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    });
  };

  return (
    <View style={styles.container}>
      {/* Header del Drawer */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Administración</Text>
      </View>

      {/* Lista de items del drawer */}
      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        {props.state.routes.map((route, index) => {
          const { options } = props.descriptors[route.key];
          const label =
            options.drawerLabel !== undefined
              ? options.drawerLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = props.state.index === index;

          return (
            <DrawerItem
              key={route.key}
              label={label as string}
              icon={options.drawerIcon ? ({ color, size }) => options.drawerIcon({ color, size }) : undefined}
              focused={isFocused}
              activeTintColor={props.drawerActiveTintColor}
              inactiveTintColor={props.drawerInactiveTintColor}
              activeBackgroundColor={props.drawerActiveBackgroundColor}
              inactiveBackgroundColor={props.drawerInactiveBackgroundColor}
              labelStyle={props.drawerLabelStyle}
              onPress={() => {
                props.navigation.navigate(route.name);
                props.navigation.closeDrawer();
              }}
            />
          );
        })}
      </DrawerContentScrollView>

      {/* Footer con botón de cerrar sesión */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => {
          handleLogout();
          props.navigation.closeDrawer();
        }}>
          <Ionicons name="log-out" size={20} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333",
  },
  header: {
    backgroundColor: "#222",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#444",
    padding: 15,
  },
  logoutButton: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});