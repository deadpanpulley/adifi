Image Editor Application
A modern web-based image editor built with React, TypeScript, and Vite. This application provides powerful image editing capabilities including background removal, filters, and more.

Features
Upload and edit images
Apply various filters and effects
Remove image backgrounds
Text overlay functionality
Layer management
Undo/Redo functionality
Dark/Light mode support
Responsive design for all devices
Tech Stack
Frontend Framework: React 18
Language: TypeScript
Build Tool: Vite
Styling: Tailwind CSS
State Management: React Context API
Icons: Lucide Icons
Linting: ESLint
Code Formatting: Prettier
Prerequisites
Node.js (v16 or higher)
npm (v8 or higher) or yarn
Getting Started
Clone the repository

git clone [your-repository-url]
cd project
Install dependencies

npm install
# or
yarn
Set up environment variables

Copy .env.example to .env
Update the environment variables as needed
Start the development server

npm run dev
# or
yarn dev
The application will be available at http://localhost:5173

Build for production

npm run build
# or
yarn build
Project Structure
project/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and service layer
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── public/            # Static assets
├── .env.example       # Example environment variables
├── index.html         # Main HTML file
└── vite.config.ts     # Vite configuration
Scripts
dev: Start development server
build: Build for production
preview: Preview production build locally
lint: Run ESLint
type-check: Run TypeScript type checking
Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request
License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments
Vite
React
Tailwind CSS
Lucide Icons

Made by [Advick Bhalla]

AI helped me debug this project although it was bad but it helped find out critical errors
