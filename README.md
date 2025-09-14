# HandyAI - AI-Powered Back Office Assistant for German Craftsmen

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite)

A modern, AI-powered back office assistant specifically designed for German craftsmen (Handwerker). Features a ChatGPT-style interface for managing customers, creating offers, and generating invoices with a clean, minimal design.

## 🎯 **Features**

### 💬 **AI Chat Interface**
- **ChatGPT-style design** with bubble conversations
- **Deterministic text parsing** for German job descriptions
- **Smart prospect creation** from natural language input
- **Real-time confirmation workflow**

### 👥 **Customer Management (CRM)**
- **Conversation-style customer list** with search functionality
- **Prospect/Customer toggle** with status tracking
- **Contact information management**
- **Activity timeline** and interaction history

### 📋 **Offers (Angebote)**
- **Professional PDF generation** with company branding
- **Material and labor cost breakdown**
- **Status tracking**: Draft → Sent → Accepted/Declined
- **Auto-generated offer numbers** (ANB-0001, ANB-0002...)

### 📄 **Invoices (Rechnungen)**
- **Generate invoices** from accepted offers
- **Professional PDF invoices** with payment terms
- **Status tracking**: Draft → Sent → Paid
- **Auto-generated invoice numbers** (RG-0001, RG-0002...)

### ⚙️ **Settings & Configuration**
- **Price list management** for materials and labor
- **Company settings** (IBAN, contact details, tax info)
- **Hourly rate configuration**
- **Inline editing** for pricing items

## 🎨 **Design System**

### **Visual Design**
- **Navy blue primary color** (#0D1B2A) with professional palette
- **Inter typography** at 15px base with clean hierarchy
- **ChatGPT-inspired layout** with generous whitespace
- **Minimal design** with subtle shadows and rounded corners

### **Responsive Design**
- **Mobile-first approach** with touch-friendly interfaces
- **Desktop sidebar navigation** with navy accent pills
- **Bottom navigation** for mobile devices
- **Adaptive layouts** that scale across all devices

### **Component Library**
- **Reusable UI components**: Button, Input, Card, Badge, Textarea
- **Consistent styling** with Tailwind CSS utilities
- **Accessibility features** with proper focus states
- **Loading states** and empty state designs

## 🛠️ **Tech Stack**

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 3.4, Custom design tokens
- **Database**: SQLite with Prisma ORM
- **PDF Generation**: pdf-lib for professional documents
- **State Management**: React hooks and local state
- **Icons**: Emoji-based with semantic meaning

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn package manager

### **Installation**

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/handyai.git
   cd handyai
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up the database**
   \`\`\`bash
   npm run db:generate
   npm run db:push
   \`\`\`

4. **Start the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### **Available Scripts**

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create and apply migrations
npm run db:studio    # Open Prisma Studio
\`\`\`

## 🗂️ **Project Structure**

\`\`\`
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── customers/     # Customer management
│   │   ├── offers/        # Offer management
│   │   └── invoices/      # Invoice management
│   ├── kunden/            # Customer pages
│   ├── angebote/          # Offers pages
│   ├── rechnungen/        # Invoices pages
│   ├── einstellungen/     # Settings pages
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── AppShell.tsx       # Main app layout
│   ├── ChatInterface.tsx  # Chat UI
│   └── ChatBubble.tsx     # Chat message component
├── lib/
│   ├── prisma.ts          # Database client
│   └── utils.ts           # Utility functions
prisma/
├── schema.prisma          # Database schema
└── dev.db                # SQLite database
\`\`\`

## 🎯 **MVP Scope (Current)**

- ✅ **Chat UI**: Natural language prospect creation
- ✅ **Lightweight CRM**: Customer/prospect management
- ✅ **Offers**: Create, track, and generate PDFs
- ✅ **Invoices**: Generate from offers, track payments
- ✅ **Settings**: Price lists and company configuration

## 🔄 **End-to-End Workflow**

1. **Chat** → Describe job in German → AI parses details
2. **Prospect Creation** → Confirm and create new prospect
3. **CRM** → Manage customer information and status
4. **Offers** → Create professional offers with cost breakdown
5. **PDF Generation** → Download branded offer documents
6. **Status Tracking** → Monitor offer acceptance
7. **Invoice Creation** → Generate invoices from accepted offers
8. **Payment Tracking** → Track invoice payment status

## 🌟 **Key Highlights**

- **German-focused**: Built specifically for German craftsmen workflow
- **Deterministic AI**: No external LLM calls, fully predictable parsing
- **Professional PDFs**: Company-branded documents with proper formatting
- **Mobile-optimized**: Works perfectly on phones and tablets
- **Type-safe**: Full TypeScript coverage with proper error handling
- **Modern stack**: Latest Next.js, React 19, and Tailwind CSS

## 🤝 **Contributing**

This project follows clean code principles and modern development practices. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

MIT License - feel free to use this project for your own craftsmen business!

## 🙏 **Acknowledgments**

- Built with modern web technologies
- Inspired by ChatGPT's clean interface design
- Designed specifically for German Handwerker workflows
- Powered by Next.js and Tailwind CSS

---

**Ready to streamline your craftsmen business with AI?** 🔨✨