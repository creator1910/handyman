#!/usr/bin/env node

/**
 * HandyAI CRM MCP Server
 * Provides CRM tools and resources for German craftsmen businesses
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { CRMDatabase } from './database.js';

// Initialize database
const db = new CRMDatabase();

// Zod schemas for validation
const CreateCustomerSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isProspect: z.boolean().default(true)
});

const UpdateCustomerSchema = z.object({
  id: z.string().cuid('Ungültige Kunden-ID'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isProspect: z.boolean().optional()
});

const CreateOfferSchema = z.object({
  customerId: z.string().cuid('Ungültige Kunden-ID'),
  jobDescription: z.string().optional(),
  measurements: z.string().optional(),
  materialsCost: z.number().min(0).default(0),
  laborCost: z.number().min(0).default(0),
  totalCost: z.number().min(0).default(0)
});

// Create MCP server
const server = new Server(
  {
    name: 'handyai-crm-server',
    version: '1.0.0',
    description: 'CRM server for German craftsmen businesses - manage customers, offers, and invoices'
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_customer',
        description: 'Erstellt einen neuen Kunden oder Interessenten. Verwendet für neue Kundendaten mit mindestens Vor- und Nachname.',
        inputSchema: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'Vorname des Kunden (erforderlich)'
            },
            lastName: {
              type: 'string', 
              description: 'Nachname des Kunden (erforderlich)'
            },
            email: {
              type: 'string',
              description: 'E-Mail-Adresse (optional)'
            },
            phone: {
              type: 'string',
              description: 'Telefonnummer (optional)'
            },
            address: {
              type: 'string',
              description: 'Adresse (optional)'
            },
            isProspect: {
              type: 'boolean',
              description: 'true = Interessent, false = Kunde (Standard: true)'
            }
          },
          required: ['firstName', 'lastName']
        }
      },
      {
        name: 'get_customers',
        description: 'Lädt alle Kunden oder sucht nach bestimmten Kunden. Verwendet für "Zeige Kunden", "Suche nach Name".',
        inputSchema: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              description: 'Suchbegriff für Name oder E-Mail (optional, leer = alle Kunden)'
            }
          }
        }
      },
      {
        name: 'update_customer',
        description: 'Aktualisiert einen bestehenden Kunden. Zuerst Kunden-ID mit get_customers ermitteln.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Kunden-ID (von get_customers)'
            },
            firstName: {
              type: 'string',
              description: 'Neuer Vorname (optional)'
            },
            lastName: {
              type: 'string',
              description: 'Neuer Nachname (optional)'
            },
            email: {
              type: 'string',
              description: 'Neue E-Mail (optional)'
            },
            phone: {
              type: 'string',
              description: 'Neue Telefonnummer (optional)'
            },
            address: {
              type: 'string',
              description: 'Neue Adresse (optional)'
            },
            isProspect: {
              type: 'boolean',
              description: 'Status ändern (optional)'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'create_offer',
        description: 'Erstellt ein neues Angebot für einen Kunden. Zuerst Kunden-ID mit get_customers ermitteln.',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'Kunden-ID (von get_customers)'
            },
            jobDescription: {
              type: 'string',
              description: 'Arbeitsbeschreibung (optional)'
            },
            measurements: {
              type: 'string',
              description: 'Maße und Details (optional)'
            },
            materialsCost: {
              type: 'number',
              description: 'Materialkosten in Euro (Standard: 0)'
            },
            laborCost: {
              type: 'number',
              description: 'Arbeitskosten in Euro (Standard: 0)'
            },
            totalCost: {
              type: 'number',
              description: 'Gesamtkosten in Euro (Standard: 0)'
            }
          },
          required: ['customerId']
        }
      },
      {
        name: 'get_offers',
        description: 'Lädt alle Angebote oder Angebote für einen bestimmten Kunden.',
        inputSchema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'Kunden-ID für Filter (optional, leer = alle Angebote)'
            }
          }
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_customer': {
        const validated = CreateCustomerSchema.parse(args);
        const result = await db.createCustomer(validated);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_customers': {
        const search = args?.search as string | undefined;
        const result = await db.getCustomers(search);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'update_customer': {
        const validated = UpdateCustomerSchema.parse(args);
        const { id, ...updateData } = validated;
        const result = await db.updateCustomer(id, updateData);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'create_offer': {
        const validated = CreateOfferSchema.parse(args);
        const result = await db.createOffer(validated);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'get_offers': {
        const customerId = args?.customerId as string | undefined;
        const result = await db.getOffers(customerId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unbekanntes Tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler',
            message: 'Tool-Ausführung fehlgeschlagen'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'crm://customers/all',
        mimeType: 'application/json',
        name: 'Alle Kunden',
        description: 'Übersicht über alle Kunden und Interessenten'
      },
      {
        uri: 'crm://offers/all', 
        mimeType: 'application/json',
        name: 'Alle Angebote',
        description: 'Übersicht über alle erstellten Angebote'
      },
      {
        uri: 'crm://stats/overview',
        mimeType: 'application/json',
        name: 'CRM Statistiken',
        description: 'Übersicht über CRM-Kennzahlen'
      }
    ]
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'crm://customers/all': {
        const customers = await db.getCustomers();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(customers, null, 2)
            }
          ]
        };
      }

      case 'crm://offers/all': {
        const offers = await db.getOffers();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json', 
              text: JSON.stringify(offers, null, 2)
            }
          ]
        };
      }

      case 'crm://stats/overview': {
        const stats = await db.getStats();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unbekannte Ressource: ${uri}`);
    }
  } catch (error) {
    throw new Error(`Fehler beim Laden der Ressource ${uri}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
});

// Start server
async function main() {
  console.error('HandyAI CRM MCP Server gestartet');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Server verbunden und bereit für Anfragen');
}

main().catch((error) => {
  console.error('Server-Fehler:', error);
  process.exit(1);
});