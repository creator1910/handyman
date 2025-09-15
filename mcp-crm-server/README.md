# HandyAI CRM MCP Server

Ein Model Context Protocol (MCP) Server für die HandyAI CRM-Anwendung, speziell entwickelt für deutsche Handwerksbetriebe (Maler und Gartenbau).

## Features

### 🛠️ Tools (Aktionen)
- **create_customer**: Erstellt neue Kunden oder Interessenten
- **get_customers**: Lädt und durchsucht bestehende Kunden
- **update_customer**: Aktualisiert Kundendaten
- **create_offer**: Erstellt Angebote für Kunden
- **get_offers**: Lädt Angebote (alle oder für bestimmte Kunden)

### 📊 Resources (Datenquellen)
- **crm://customers/all**: Alle Kunden und Interessenten
- **crm://offers/all**: Alle erstellten Angebote
- **crm://stats/overview**: CRM-Kennzahlen und Statistiken

## Installation

```bash
# 1. In das MCP Server Verzeichnis wechseln
cd mcp-crm-server

# 2. Dependencies installieren
npm install

# 3. Prisma Client generieren
npx prisma generate

# 4. Datenbank-Schema erstellen (falls noch nicht vorhanden)
npx prisma db push

# 5. Server kompilieren
npm run build
```

## Verwendung

### Lokaler Test
```bash
# Tools auflisten
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js

# Kunden erstellen
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "create_customer", "arguments": {"firstName": "Max", "lastName": "Mustermann", "email": "max@example.com"}}}' | node dist/index.js

# Kunden auflisten
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "get_customers", "arguments": {}}}' | node dist/index.js
```

### Claude Integration

1. **MCP Konfiguration in Claude erstellen:**
```json
{
  "mcpServers": {
    "handyai-crm": {
      "command": "node",
      "args": ["./mcp-crm-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "file:./prisma/dev.db"
      }
    }
  }
}
```

2. **In Claude verwenden:**
```
Erstelle einen neuen Kunden: Hans Müller, hans@mueller.de, 040123456, Musterstraße 123 Hamburg
```

## Tool-Beschreibungen

### create_customer
Erstellt einen neuen Kunden oder Interessenten im CRM.

**Parameter:**
- `firstName` (string, erforderlich): Vorname
- `lastName` (string, erforderlich): Nachname  
- `email` (string, optional): E-Mail-Adresse
- `phone` (string, optional): Telefonnummer
- `address` (string, optional): Adresse
- `isProspect` (boolean, optional): true = Interessent, false = Kunde (Standard: true)

### get_customers
Lädt alle Kunden oder sucht nach bestimmten Kunden.

**Parameter:**
- `search` (string, optional): Suchbegriff für Name oder E-Mail

### update_customer
Aktualisiert einen bestehenden Kunden.

**Parameter:**
- `id` (string, erforderlich): Kunden-ID (von get_customers ermitteln)
- Alle anderen Parameter von create_customer (optional)

### create_offer
Erstellt ein neues Angebot für einen Kunden.

**Parameter:**
- `customerId` (string, erforderlich): Kunden-ID
- `jobDescription` (string, optional): Arbeitsbeschreibung
- `measurements` (string, optional): Maße und Details
- `materialsCost` (number, optional): Materialkosten in Euro
- `laborCost` (number, optional): Arbeitskosten in Euro
- `totalCost` (number, optional): Gesamtkosten in Euro

### get_offers
Lädt alle Angebote oder Angebote für einen bestimmten Kunden.

**Parameter:**
- `customerId` (string, optional): Kunden-ID für Filter

## Datenbank

Der Server verwendet die gleiche SQLite-Datenbank wie die Haupt-HandyAI-Anwendung (`../prisma/dev.db`) und teilt sich folgende Tabellen:

- **customers**: Kunden und Interessenten
- **offers**: Angebote mit automatischer Nummerierung (ANG-YYYY-NNNN)
- **invoices**: Rechnungen (über Haupt-App verwaltet)
- **appointments**: Termine (über Haupt-App verwaltet)

## Entwicklung

```bash
# Development Server starten
npm run dev

# Watch Mode für TypeScript
npm run watch

# Build für Production
npm run build
```

## Architektur

```
mcp-crm-server/
├── src/
│   ├── index.ts          # MCP Server Hauptdatei
│   ├── database.ts       # Datenbank-Abstraktion
├── prisma/
│   └── schema.prisma     # Prisma Schema (kopiert von Haupt-App)
├── dist/                 # Kompilierte JavaScript-Dateien
└── package.json
```

## Sicherheit

- Der Server läuft nur lokal über STDIO-Transport
- Keine Netzwerk-Exposition
- Direkte Datenbank-Zugriffe über Prisma ORM
- Zod-Validierung für alle Eingaben

## Troubleshooting

### Prisma Client Fehler
```bash
npx prisma generate
```

### Datenbank nicht gefunden
```bash
npx prisma db push
```

### TypeScript Kompilierungsfehler
```bash
npm run build
```