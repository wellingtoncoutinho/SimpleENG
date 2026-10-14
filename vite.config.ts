import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import {
  generateLessonWithGemini,
  generateWeeklyPlanWithGemini,
  synthesizeSpeechWithGemini,
} from './server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/generate-lesson', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const input = JSON.parse(body);
            const lesson = await generateLessonWithGemini(input);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(lesson));
          } catch (err: any) {
            console.error('API /generate-lesson error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Generation failed' }));
          }
        });
      });

      server.middlewares.use('/api/generate-weekly-plan', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const input = JSON.parse(body);
            const plan = await generateWeeklyPlanWithGemini(input);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(plan));
          } catch (err: any) {
            console.error('API /generate-weekly-plan error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Plan generation failed' }));
          }
        });
      });

      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', async () => {
          try {
            const { text, voice } = JSON.parse(body);
            const audio = await synthesizeSpeechWithGemini(text, voice || 'Aoede');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ audio }));
          } catch (err: any) {
            console.error('API /tts error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'TTS synthesis failed' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

