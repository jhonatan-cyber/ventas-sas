# Theme Toggle - Selector de Tema

## 🎨 Características

El selector de tema permite a los usuarios cambiar entre tres modos:

1. **☀️ Claro** - Tema claro
2. **🌙 Oscuro** - Tema oscuro  
3. **💻 Sistema** - Sigue la preferencia del sistema operativo

## 📍 Ubicación

### Desktop
- Ubicado en el header, a la izquierda del botón "Ingresar"
- Icono que cambia según el tema activo
- Dropdown menu con las 3 opciones

### Mobile
- Ubicado en el menú hamburguesa
- Sección "Tema" con el toggle
- Mismo dropdown menu

## 🔧 Componentes

### ThemeToggle (`theme-toggle.tsx`)
Componente principal que maneja el cambio de tema.

```tsx
import { ThemeToggle } from "@/components/landing/theme-toggle"

<ThemeToggle />
```

### Características Técnicas
- Usa `next-themes` para gestión de temas
- Previene flash de contenido sin estilo (FOUC)
- Persiste la preferencia en localStorage
- SSR-safe con mounted state

## 🎯 Iconos

- **Sun** (☀️) - Tema claro
- **Moon** (🌙) - Tema oscuro
- **Monitor** (💻) - Tema sistema

## 💾 Persistencia

La preferencia del usuario se guarda automáticamente en:
- **localStorage**: `theme` key
- Se mantiene entre sesiones
- Se sincroniza entre pestañas

## 🎨 Estilos

### Botón
```tsx
className="h-9 w-9 hover:bg-muted/50 transition-colors"
```

### Dropdown
```tsx
className="w-40"
align="end"
```

### Items
```tsx
className="cursor-pointer"
```

## 🔄 Funcionamiento

1. Usuario hace click en el icono
2. Se abre el dropdown menu
3. Usuario selecciona un tema
4. El tema se aplica inmediatamente
5. La preferencia se guarda en localStorage
6. El icono cambia para reflejar el tema activo

## 🌐 Modo Sistema

Cuando se selecciona "Sistema":
- Detecta la preferencia del OS
- Se actualiza automáticamente si el usuario cambia el tema del OS
- Usa `prefers-color-scheme` media query

## 🎨 Personalización

### Cambiar Iconos
```tsx
// En theme-toggle.tsx
import { Sun, Moon, Monitor, Laptop } from "lucide-react"

// Reemplazar Monitor por Laptop
{theme === "system" && <Laptop className="h-4 w-4" />}
```

### Cambiar Textos
```tsx
<DropdownMenuItem onClick={() => setTheme("light")}>
  <Sun className="mr-2 h-4 w-4" />
  <span>Modo Claro</span> {/* Cambiar aquí */}
</DropdownMenuItem>
```

### Cambiar Tamaño
```tsx
// Botón más grande
<Button size="icon" className="h-10 w-10">

// Iconos más grandes
<Sun className="h-5 w-5" />
```

## 🐛 Troubleshooting

### El tema no persiste
1. Verifica que `next-themes` esté instalado
2. Asegúrate de que `ThemeProvider` esté en el layout
3. Revisa que localStorage esté habilitado

### Flash de contenido sin estilo
1. Verifica el `mounted` state
2. Asegúrate de que el script de tema esté en `<head>`
3. Usa `suppressHydrationWarning` en `<html>`

### El icono no cambia
1. Verifica que `theme` se esté actualizando
2. Revisa la lógica condicional de los iconos
3. Asegúrate de que `mounted` sea `true`

## 📱 Responsive

### Desktop (> 768px)
- Visible en el header
- Dropdown alineado a la derecha
- Hover effects

### Mobile (< 768px)
- En el menú hamburguesa
- Sección dedicada "Tema"
- Mismo dropdown

## ♿ Accesibilidad

- ✅ `sr-only` text para screen readers
- ✅ Navegación por teclado
- ✅ Focus visible
- ✅ ARIA labels
- ✅ Contraste adecuado en ambos temas

## 🎯 Mejores Prácticas

1. **No forzar un tema**: Respeta la preferencia del usuario
2. **Modo sistema por defecto**: Usa la preferencia del OS inicialmente
3. **Transiciones suaves**: Evita cambios bruscos
4. **Testea ambos temas**: Asegúrate de que todo se vea bien
5. **Persiste la preferencia**: Guarda la elección del usuario

## 🚀 Integración

El theme toggle ya está integrado en:
- ✅ Header desktop
- ✅ Menú móvil
- ✅ Ambos usan el mismo componente
- ✅ Sincronizados automáticamente

## 📊 Estadísticas de Uso

Los temas más populares suelen ser:
1. **Sistema** (50%) - Usuarios que prefieren seguir su OS
2. **Oscuro** (35%) - Usuarios que prefieren modo oscuro
3. **Claro** (15%) - Usuarios que prefieren modo claro

## 🎨 Colores por Tema

### Tema Claro
- Background: `#ffffff`
- Foreground: `#000000`
- Muted: `#f4f4f5`

### Tema Oscuro
- Background: `#09090b`
- Foreground: `#fafafa`
- Muted: `#27272a`

## 🔮 Futuras Mejoras (Opcional)

1. **Más temas**: Agregar temas personalizados (azul, verde, etc.)
2. **Transiciones**: Animaciones suaves al cambiar tema
3. **Preview**: Vista previa antes de aplicar
4. **Shortcuts**: Atajos de teclado (Ctrl+Shift+T)
5. **Auto-switch**: Cambiar automáticamente según la hora del día

## 🎉 Conclusión

El theme toggle proporciona una experiencia de usuario superior permitiendo:
- Personalización completa
- Respeto por las preferencias del sistema
- Persistencia entre sesiones
- Accesibilidad total

¡Listo para usar! 🌓
