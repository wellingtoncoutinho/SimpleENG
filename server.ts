import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateLessonWithGemini,
  generateWeeklyPlanWithGemini,
  synthesizeSpeechWithGemini,
  analyzeDaySpeechWithGemini,
} from './server/geminiService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

app.post('/api/generate-lesson', async (req, res) => {
  try {
    const { topic, level, targetWords, notes } = req.body;
    if (!topic || !targetWords || !targetWords.length) {
      return res.status(400).json({ error: 'Missing required lesson fields' });
    }
    const lesson = await generateLessonWithGemini({
      topic,
      level: level || 'B2',
      targetWords,
      notes: notes || '',
    });
    res.json(lesson);
  } catch (err: any) {
    console.error('Error in /api/generate-lesson:', err);
    res.status(500).json({ error: err.message || 'Failed to generate lesson' });
  }
});

app.post('/api/generate-weekly-plan', async (req, res) => {
  try {
    const { topic, level, rawNotes, parsedItems, classDay, dailyMinutesGoal, clientDateIso } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Missing topic' });
    }
    const plan = await generateWeeklyPlanWithGemini({
      topic,
      level: level || 'B2',
      rawNotes: rawNotes || '',
      parsedItems: parsedItems || [],
      classDay: classDay || 'Quarta-feira',
      dailyMinutesGoal: dailyMinutesGoal || 20,
      clientDateIso,
    });
    res.json(plan);
  } catch (err: any) {
    console.error('Error in /api/generate-weekly-plan:', err);
    res.status(500).json({ error: err.message || 'Failed to generate weekly plan' });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }
    const audio = await synthesizeSpeechWithGemini(text, voice || 'Kore');
    res.json({ audio });
  } catch (err: any) {
    console.error('Error in /api/tts:', err);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

app.post('/api/analyze-day-speech', async (req, res) => {
  try {
    const { audioBase64, mimeType, liveTranscript, userLevel, targetWords } = req.body;
    if (!audioBase64 && !liveTranscript) {
      return res.status(400).json({ error: 'Missing audio or transcript to analyze' });
    }
    const analysis = await analyzeDaySpeechWithGemini({
      audioBase64,
      mimeType,
      liveTranscript,
      userLevel,
      targetWords,
    });
    res.json(analysis);
  } catch (err: any) {
    console.error('Error in /api/analyze-day-speech:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze day speech' });
  }
});

// Serve static assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SimpleENG server running on http://0.0.0.0:${PORT}`);
});
