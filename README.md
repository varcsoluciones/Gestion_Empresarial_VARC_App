# 👔 VARC Soluciones — Micro ERP para PYMES

Un sistema Micro ERP moderno, intuitivo y de alto rendimiento diseñado específicamente para pequeñas y medianas empresas (PYMES), con un caso de referencia para **tiendas de ropa con variantes (Tallas y Colores)** y una estética premium inspirada en el ecosistema Apple.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)
![Design](https://img.shields.io/badge/Design-Apple%20Aesthetic-555555?logo=apple&logoColor=white)

---

## ✨ Características Principales

### 1. 🏷️ Datos Maestros con Variantes de Producto
- Catálogo de productos con soporte para **múltiples variantes (Talla, Color, SKU)** y control de inventario independiente por variante.
- Directorio de **Clientes**, **Proveedores** y **Categorías**.
- Modales de **Creación Rápida (*Quick-Create*)**: Da de alta nuevos clientes o proveedores directamente dentro de formularios de ventas o compras sin perder el progreso.

### 2. 🛒 Compras & Cuentas por Pagar (CxP)
- Creación de órdenes de compra con cálculo automático de impuestos.
- **Recepción de Mercancía**: Ingreso automático a inventario con recálculo de **Costo Promedio Ponderado**.
- Registro de pagos a proveedores y control de saldos vencidos.
- **Inmutabilidad y Auditoría**: Cancelación con motivo registrado y reversión compensatoria de inventario.

### 3. 📦 Inventarios & Kardex Permanente
- Monitoreo de stock actual con desglose de variantes y alertas de nivel crítico.
- **Kardex Permanente**: Trazabilidad completa de entradas, salidas y ajustes con saldos continuos de existencias y costos.
- **Ajustes Manuales**: Formulario con motivos obligatorios (*Merma*, *Conteo Físico*, *Pérdida*, *Muestras*, etc.).

### 4. 💼 Ventas & Cuentas por Cobrar (CxC)
- Generación de **Cotizaciones** y **conversión a Factura en 1 clic**.
- Emisión de facturas con deducción automática de stock y cálculo de impuestos.
- Registro de cobros parciales y totales.
- **Impresión / Exportación**: Formato imprimible limpio con sellos de estado y diseño corporativo.

### 5. 📊 Costos, Depreciación & Prorrateo de Costo Real
- Registro de **Gastos Operativos** fijos y variables.
- Gestión de **Activos Fijos** con cálculo de **depreciación mensual en línea recta**.
- **Prorrateo de Costo Unitario Real**:
  $$\text{Costo Real} = \text{Costo de Compra} + \text{Sobrecosto Operativo Prorrateado por Unidad}$$
  Permite conocer el margen neto real de cada producto tras absorber la estructura operativa del negocio.

### 6. 📈 Reportes Financieros Ejecutivos
- **Estado de Resultados (P&L)** con margen bruto y utilidad neta operativa.
- **Balance General** clasificado (Activos Circulantes, Activos Fijos Netos, Pasivos y Patrimonio).
- **Matriz de Rentabilidad por Producto**.

### 7. 🎨 Personalización & Estética Apple
- Soporte para **Modo Claro y Modo Oscuro** con transiciones suaves.
- **6 Paletas de Acento**: Índigo, Zafiro Cupertino, Esmeralda Pro, Rosa Coral, Ámbar Dorado y Pizarra Minimalista.
- Componentes con *glassmorphism*, `backdrop-filter`, accesibilidad con tecla `Escape` y microanimaciones fluidas.

---

## 🚀 Inicio Rápido

### Prerrequisitos
- **Node.js**: `v20.x` o superior
- **npm**: `v10.x` o superior

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/varcsoluciones/Gestion_Empresarial_VARC_App.git

# 2. Entrar al directorio
cd Gestion_Empresarial_VARC_App

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:5173/` para comenzar a usar la aplicación.

### Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo Vite con Hot Module Replacement (HMR).
- `npm run build`: Compila la aplicación con verificación de tipos TypeScript y genera el bundle de producción en `dist/`.
- `npm run preview`: Previsualiza la versión de producción localmente.

---

## 🏛️ Estructura del Proyecto

```
Gestion_Empresarial_App/
├── src/
│   ├── components/
│   │   ├── common/             # Badges, Modales, Combobox inline
│   │   ├── layout/             # Sidebar, Topbar, navegación
│   │   ├── print/              # Plantilla de impresión de documentos
│   │   └── quick-create/       # Modales de creación rápida en el flujo
│   ├── context/
│   │   └── ERPContext.tsx      # Estado reactivo global con persistencia LocalStorage
│   ├── data/
│   │   └── seedData.ts         # Dataset de demostración realista
│   ├── pages/
│   │   ├── DashboardPage.tsx   # KPIs ejecutivos
│   │   ├── MasterDataPage.tsx  # Productos, variantes, clientes, proveedores
│   │   ├── PurchasesPage.tsx   # Compras y CxP
│   │   ├── InventoryPage.tsx   # Stock y Kardex permanente
│   │   ├── SalesPage.tsx       # Ventas, cotizaciones y CxC
│   │   ├── AccountingPage.tsx  # Gastos, activos, depreciación y prorrateo
│   │   ├── ReportsPage.tsx     # P&L, Balance y Rentabilidad
│   │   └── SettingsPage.tsx    # Configuración de tema y empresa
│   ├── types/
│   │   └── erp.ts              # Modelos de datos TypeScript
│   ├── utils/
│   │   └── formatters.ts       # Utilidades monetarias, fechas y costos
│   ├── App.tsx
│   ├── index.css               # Sistema de diseño Apple con tokens CSS
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 🔒 Inmutabilidad y Auditoría

La plataforma sigue principios contables de no-eliminación física:
- Ninguna factura u orden de compra recibida se borra de la base de datos.
- Las cancelaciones requieren un **motivo obligatorio**, registran al usuario/fecha y emiten movimientos compensatorios automáticos en el Kardex de inventario.

---

## 📄 Licencia

Desarrollado para **VARC Soluciones**. Todos los derechos reservados.
