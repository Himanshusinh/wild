# Firebase Setup Guide

This guide will help you set up Firebase for the WildMind AI Generation project to enable image history storage.

## Prerequisites

- A Google account
- Access to the [Firebase Console](https://console.firebase.google.com/)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "wildmind-ai-generation")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set up Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for now (you can configure security rules later)
4. Select a location for your database (choose the one closest to your users)
5. Click "Done"

## Step 3: Set up Firebase Storage

1. In your Firebase project console, click on "Storage" in the left sidebar
2. Click "Get started"
3. Review the security rules (start in test mode for development)
4. Choose a location for your storage bucket
5. Click "Done"

## Step 4: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to the "Your apps" section
4. Click on the web icon (</>) to add a web app
5. Enter an app nickname (e.g., "wildmind-web-app")
6. Check "Also set up Firebase Hosting" if you plan to deploy to Firebase (optional)
7. Click "Register app"
8. Copy the Firebase configuration object

## Step 5: Update Environment Variables

1. Open your `.env.local` file in the project root
2. Replace the placeholder Firebase configuration values with your actual values:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

## Step 6: Configure Security Rules (Production)

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /generationHistory/{document} {
      allow read, write: if true; // Adjust based on your authentication needs
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /generated-images/{allPaths=**} {
      allow read, write: if true; // Adjust based on your authentication needs
    }
  }
}
```

## Step 7: Test the Setup

1. Start your development server: `npm run dev`
2. Generate an image using the application
3. Check your Firestore database for a new document in the `generationHistory` collection
4. Check your Storage bucket for uploaded images in the `generated-images` folder
5. Navigate to the History section to see your generated images

## Troubleshooting

### Common Issues

1. **"Firebase configuration not found"**
   - Make sure all environment variables are set correctly
   - Restart your development server after updating `.env.local`

2. **"Permission denied" errors**
   - Check your Firestore and Storage security rules
   - Make sure you're in test mode during development

3. **Images not uploading**
   - Check your Storage security rules
   - Verify the storage bucket name in your configuration

4. **History not loading**
   - Check your Firestore security rules
   - Verify the project ID in your configuration

### Getting Help

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage)

## Features Enabled

Once Firebase is set up, you'll have:

✅ **Image History Storage** - All generated images are saved to Firebase Storage
✅ **Generation History** - Prompts and metadata stored in Firestore
✅ **History View** - Browse all your previous generations
✅ **Persistent Storage** - Images and data persist across sessions
✅ **Scalable Infrastructure** - Firebase handles scaling automatically
