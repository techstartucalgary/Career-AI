import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'expo-router': path.resolve(__dirname, 'src/shims/expo-router.jsx'),
      'expo-linear-gradient': path.resolve(__dirname, 'src/shims/expo-linear-gradient.jsx'),
      'expo-document-picker': path.resolve(__dirname, 'src/shims/expo-document-picker.js'),
      'expo-image-picker': path.resolve(__dirname, 'src/shims/expo-image-picker.js'),
      'expo-modules-core': path.resolve(__dirname, 'src/shims/expo-modules-core.js'),
      '@expo/vector-icons/Octicons': path.resolve(__dirname, 'src/shims/expo-vector-icons-octicons.jsx'),
      '@expo/vector-icons': path.resolve(__dirname, 'src/shims/expo-vector-icons.jsx'),
    },
    extensions: ['.web.js', '.js', '.jsx', '.json'],
  },
})
