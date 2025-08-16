# FlowVision - AI-Powered Efficiency Intelligence Platform

<div align="center">
  <img src="public/logo-flowvision.svg" alt="FlowVision Logo" width="200"/>
  
  **Transform friction into flow with AI-powered efficiency intelligence**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://prisma.io/)
</div>

## 🎯 Overview

FlowVision is a comprehensive efficiency intelligence platform designed for SMB leadership (50-200 employees) to detect operational friction, categorize improvement ideas, and create strategic roadmaps. The platform focuses on conversation-first collaboration for internal operational challenges, featuring professional requirements cards with risk assessment, user stories, and complete audit traceability.

### ✨ Key Features

- **🔍 Issue Identification**: Visual heatmap of operational friction points with team voting
- **💡 Collaborative Ideation**: AI-moderated team conversations with structured capture
- **📋 Initiative Management**: Professional requirement cards with KPIs and dependencies
- **📊 Prioritization Matrix**: Interactive difficulty vs ROI visualization with team voting
- **📈 Progress Tracking**: Kanban workflow with real-time status updates
- **🗺️ Strategic Roadmap**: Timeline, milestone, and resource utilization views
- **👥 Team Collaboration**: Role-based access with comprehensive audit logging
- **📁 Document Management**: Secure file attachments with version control

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Docker (for development environment)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/flowvision.git
   cd flowvision
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**

   ```bash
   # Start PostgreSQL with Docker
   docker-compose up -d

   # Run database migrations
   npx prisma migrate dev

   # Seed initial data
   npx prisma db seed
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with: `admin@example.com` / `Admin123!`

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Styling**: Tailwind CSS with custom design system
- **Testing**: Jest (unit), Cypress (E2E)
- **DevOps**: Docker, GitHub Actions

### Project Structure

```
FlowVision/
├── 📚 docs/                       # All Documentation (organized by category)
│   ├── architecture/              # System design & technical guides
│   ├── development/               # Developer setup & best practices
│   ├── security/                  # Security documentation & audits
│   ├── project-management/        # Sprint plans, reviews & processes
│   ├── design/                    # UI/UX design systems & guidelines
│   ├── quality-assurance/         # QA reports & testing documentation
│   ├── production/                # Production deployment & operations
│   ├── analysis-reports/          # Analysis results & strategic assessments
│   ├── user-guides/               # End-user documentation & help
│   └── templates/                 # Document templates for consistency
│
├── ⚙️ config/                     # Configuration Management
│   ├── docker/                    # Docker & containerization configs
│   ├── environment/               # Environment variable templates
│   ├── nginx/                     # Web server configurations
│   └── monitoring/                # Monitoring & observability configs
│
├── 🏗️ app/                       # Next.js 13+ app directory
│   ├── api/                       # API routes
│   ├── auth/                      # Authentication pages
│   ├── admin/                     # Admin dashboard
│   ├── initiatives/               # Initiative management
│   ├── issues/                    # Issue tracking
│   ├── ideas/                     # Idea collaboration
│   └── profile/                   # User profiles
│
├── 🧩 components/                 # Reusable React components
├── 📚 lib/                       # Utility libraries & services
├── 🗄️ prisma/                    # Database schema & migrations
├── 🧪 tests/                     # Test suites
├── 🔧 scripts/                   # Utility & deployment scripts
├── 🛠️ tools/                     # Development tools & utilities
├── 📁 archive/                   # Archived/legacy files
└── 📝 types/                     # TypeScript definitions
```

## 👥 User Roles & Permissions

### Admin Users

- **User Management**: Create, edit, delete user accounts
- **Role Assignment**: Manage user permissions and access levels
- **System Administration**: View audit logs, system statistics
- **Data Export**: Access to all system data and reports

### Leader Users

- **Initiative Management**: Create and manage initiatives
- **Team Collaboration**: Participate in voting and discussions
- **Progress Tracking**: Update status and monitor progress
- **Reporting**: View initiative and team performance data

## 🔧 Development

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# End-to-end tests
npm run cypress:open
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Create new migration
npx prisma migrate dev --name your-migration-name

# Reset database
npx prisma migrate reset
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Format code
npx prettier --write .
```

## 🚀 Deployment

### Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# NextAuth
NEXTAUTH_SECRET=your-secret-key-32-chars-minimum
NEXTAUTH_URL=https://your-domain.com

# Optional: OpenAI for AI features
OPENAI_API_KEY=your-openai-key
```

### Production Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Deploy to Vercel** (recommended)

   ```bash
   npx vercel --prod
   ```

3. **Or deploy to other platforms**
   - Configure your hosting platform
   - Set environment variables
   - Deploy the built application

## 📊 Use Case: Morrison Architecture

FlowVision is perfectly suited for professional services firms like Morrison Architecture (75 employees) dealing with operational inefficiencies:

### Challenge

- Client design approvals taking 3+ weeks
- Manual processes causing project delays
- Lack of visibility into workflow bottlenecks

### FlowVision Solution

1. **Issue Identification**: Team identifies "Client approval bottlenecks"
2. **Collaborative Ideation**: Brainstorm "Digital approval platform" solution
3. **Initiative Planning**: Create comprehensive project with KPIs and timeline
4. **Team Prioritization**: Vote on difficulty vs ROI (Difficulty: 40, ROI: 85)
5. **Progress Tracking**: Kanban workflow from concept to completion
6. **Resource Planning**: Timeline view with team capacity management

### Results

- Reduced approval time from 3 weeks to 5 days
- Increased client satisfaction scores
- Clear project visibility and accountability

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📋 Roadmap

### Phase 1: MVP Enhancement ✅

- [x] User management and authentication
- [x] Initiative creation and tracking
- [x] Team collaboration features
- [x] Basic reporting and analytics

### Phase 2: AI Intelligence (Q2 2024)

- [ ] Advanced AI-powered suggestions
- [ ] Automated requirement generation
- [ ] Intelligent priority scoring
- [ ] Natural language processing for issue analysis

### Phase 3: Enterprise Features (Q3 2024)

- [ ] Advanced integrations (Jira, Slack, Teams)
- [ ] Custom workflow templates
- [ ] Advanced analytics and reporting
- [ ] Multi-tenant support

### Phase 4: Mobile & API (Q4 2024)

- [ ] Mobile application (iOS/Android)
- [ ] Public API with webhooks
- [ ] Third-party integrations marketplace
- [ ] Advanced security features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.flowvision.app](https://docs.flowvision.app)
- **Issues**: [GitHub Issues](https://github.com/yourusername/flowvision/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/flowvision/discussions)
- **Email**: support@flowvision.app

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
- Database powered by [Prisma](https://prisma.io/) and [PostgreSQL](https://postgresql.org/)
- UI components from [Tailwind CSS](https://tailwindcss.com/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)

---

<div align="center">
  <p>Made with ❤️ for operational excellence</p>
  <p>Transform friction into flow with FlowVision</p>
</div>
