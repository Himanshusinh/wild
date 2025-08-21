# WildMind AI - Multi-Provider Image Generation Platform

A comprehensive Next.js application that integrates multiple AI image generation providers, offering users access to various models and capabilities through a unified interface.

## 🚀 Features

### Multi-Provider Support
- **BFL.ai Models**: Flux Kontext Pro/Max, FLUX.1 Pro/Dev, and more
- **Runway Models**: Gen4 Image and Gen4 Image Turbo
- **MiniMax Models**: Image-01 with character reference support

### Core Functionality
- Text-to-image generation
- Image-to-image generation with reference images
- Multiple image generation per request
- Real-time progress tracking
- Comprehensive history management
- Bookmark system for favorite generations
- Responsive, modern UI with dark theme

### Advanced Features
- Automatic model switching based on uploaded images
- Frame size and aspect ratio controls
- Style selection and customization
- Image upload with preview thumbnails
- Download and fullscreen preview capabilities
- Toast notifications for user feedback

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Deployment**: Vercel

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── generate/      # BFL.ai integration
│   │   ├── runway/        # Runway integration
│   │   └── minimax/       # MiniMax integration
│   └── view/              # Main application views
│       └── Generation/     # Core generation features
├── components/             # Reusable UI components
├── store/                  # Redux store and slices
├── lib/                    # Utility functions and services
└── types/                  # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- API keys for desired providers

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wild
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with your API keys:
   ```bash
   # BFL.ai API Key
   BFL_API_KEY=your_bfl_api_key_here
   
   # Runway API Key (optional)
   RUNWAY_API_KEY=your_runway_api_key_here
   
   # MiniMax API Key (optional)
   MINIMAX_API_KEY=your_minimax_api_key_here
   
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 API Provider Setup

### BFL.ai
- Visit [BFL.ai](https://bfl.ai) to get your API key
- Supports multiple models with different capabilities
- Handles both text and image inputs

### Runway
- Visit [Runway Developer Portal](https://developers.runwayml.com/)
- Supports Gen4 models with reference image capabilities
- Asynchronous generation with progress tracking

### MiniMax
- Visit [MiniMax API](https://api.minimax.io/)
- High-quality image generation with character reference support
- Supports 1-9 images per request

## 📖 Usage

### Basic Image Generation
1. Navigate to the Text-to-Image section
2. Select your preferred model from the dropdown
3. Enter a descriptive prompt
4. Choose frame size and style
5. Set the number of images to generate
6. Click "Generate" and wait for results

### Using Reference Images
1. Upload one or more reference images using the attach button
2. Models that support image inputs will automatically appear
3. Enter your prompt describing the desired output
4. Generate images that incorporate your reference

### Managing History
- View all your generations in the History section
- Filter by generation type or model
- Download generated images
- Preview images in fullscreen mode

## 🔧 Configuration

### Model Selection
The application automatically filters available models based on:
- Whether you've uploaded reference images
- Model capabilities (text-only vs. image-input)
- Provider availability

### Frame Sizes
Supported aspect ratios:
- Square: 1:1
- Landscape: 16:9, 4:3, 3:2, 21:9
- Portrait: 9:16, 3:4, 2:3
- Custom: Width/height combinations (multiples of 8 for MiniMax)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- Build the project: `npm run build`
- Deploy the `out` directory to your preferred hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](docs/)
- Review [integration guides](RUNWAY_INTEGRATION.md, MINIMAX_INTEGRATION.md)
- Open an issue on GitHub

## 🔄 Updates

Stay updated with the latest features and improvements:
- Follow the repository for updates
- Check the changelog for version history
- Review integration guides for new provider additions
