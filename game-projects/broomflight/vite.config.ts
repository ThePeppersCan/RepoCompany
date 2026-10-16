import {defineConfig} from 'vite';
export default defineConfig({base:'/broomflight/',build:{target:'es2022',outDir:'../../dist/broomflight',emptyOutDir:true,chunkSizeWarningLimit:900}});
