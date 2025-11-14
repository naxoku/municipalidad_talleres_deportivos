# Sistema de Diseño - Municipalidad de Angol

## 🎨 Paleta de Colores

### Color Principal
- **Verde Muni**: `#00862d` - Color destacado de la Municipalidad de Angol
- **Verde Claro**: `#00a338` - Para estados hover/active
- **Verde Oscuro**: `#006622` - Para estados pressed
- **Verde Suave**: `#e6f4ed` - Para fondos sutiles

### Azules Deportes (del logo Unidad de Deportes)
- **Azul Principal**: `#1e88e5` - Complementario al verde
- **Azul Claro**: `#42a5f5` - Para variaciones
- **Azul Oscuro**: `#1565c0` - Para contraste
- **Azul Suave**: `#e3f2fd` - Para fondos y selecciones

### Colores de Fondo
- **Primario**: `#ffffff` - Blanco puro
- **Secundario**: `#f8f9fa` - Gris muy claro
- **Terciario**: `#f0f2f5` - Gris claro

### Colores de Texto
- **Primario**: `#1a1a1a` - Casi negro
- **Secundario**: `#5f6368` - Gris medio
- **Terciario**: `#9aa0a6` - Gris claro
- **Claro**: `#ffffff` - Blanco

### Estados
- **Éxito**: `#00862d` (verde muni)
- **Advertencia**: `#ff9800` (naranja)
- **Error**: `#e53935` (rojo)
- **Info**: `#1e88e5` (azul deportes)

## 📐 Espaciado

```typescript
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
xxl: 48px
```

## 🔘 Border Radius

```typescript
sm: 4px
md: 8px
lg: 12px
xl: 16px
full: 9999px (circular)
```

## 📝 Tipografía

### Tamaños
- **xs**: 12px
- **sm**: 14px
- **md**: 16px
- **lg**: 18px
- **xl**: 20px
- **xxl**: 24px
- **xxxl**: 32px

### Pesos
- **regular**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

## 🎯 Principios de Diseño

### 1. Minimalismo
- Espacios en blanco generosos
- Elementos visuales limpios
- Jerarquía clara de información

### 2. Coherencia Cromática
- Verde `#00862d` como color de acción principal
- Azules para elementos secundarios e informativos
- Bordes sutiles con colores neutros

### 3. Legibilidad
- Contraste adecuado en todos los textos
- Tamaños de fuente accesibles
- Espaciado consistente

### 4. Toques Coloridos
- Bordes laterales de color en las tarjetas
- Botones con colores vibrantes
- Fondos suaves para selecciones

## 🧩 Componentes

### Button
**Variantes disponibles:**
- `primary` - Verde muni (principal)
- `secondary` - Azul deportes
- `success` - Verde muni
- `danger` - Rojo error
- `outline` - Transparente con borde verde

### Input
- Bordes sutiles con focus verde
- Labels medium weight
- Mensajes de error en rojo

### Table
- Header con fondo verde suave
- Bordes verdes
- Filas alternadas
- Hover azul suave

### Cards
- Sombras sutiles
- Borde lateral colorido (azul por defecto)
- Padding generoso
- Border radius grande (12px)

## 📱 Uso

### Importar tema

```typescript
import { colors, spacing, borderRadius, typography, shadows } from '../theme/colors';
import { sharedStyles } from '../theme/sharedStyles';
```

### Ejemplo de uso

```typescript
<View style={sharedStyles.card}>
  <Text style={sharedStyles.cardTitle}>Título</Text>
  <Text style={sharedStyles.cardDetail}>Detalle</Text>
</View>
```

### Colores en componentes

```typescript
<Button 
  title="Guardar" 
  variant="primary"  // Verde muni
/>

<ActivityIndicator color={colors.primary} />
```

## 🎨 Combinaciones Recomendadas

### Verde + Azul (Principal)
```
Background: #ffffff
Primary Action: #00862d
Secondary Action: #1e88e5
Text: #1a1a1a
```

### Para Destacar Información
```
Card Border: #1e88e5 (azul)
Background: #e3f2fd (azul suave)
Text: #1565c0 (azul oscuro)
```

### Para Acciones Exitosas
```
Button: #00862d
Text: #ffffff
Background Hover: #00a338
```

## 🚀 Implementación en Nuevas Pantallas

1. Importar `sharedStyles` y `colors`
2. Usar `sharedStyles` para estructura básica
3. Crear solo estilos locales específicos si es necesario
4. Seguir la paleta de colores establecida

## 📊 Navegación

El drawer de navegación usa:
- Fondo: Verde muni `#00862d`
- Item activo: Verde claro `#00a338`
- Texto: Blanco `#ffffff`

---

**Diseñado para**: Municipalidad de Angol - Unidad de Deportes
**Colores corporativos**: Verde #00862d (Muni) + Azules (Logo Deportes)
**Estilo**: Minimalista con toques coloridos
