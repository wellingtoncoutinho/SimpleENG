import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateLessonWithGemini } from '../server/geminiService.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, level, targetWords, notes, language } = req.body || {};
    if (!topic || !targetWords || !targetWords.length) {
      return res.status(400).json({ error: 'Missing required lesson fields' });
    }
    const lesson = await generateLessonWithGemini({
      topic,
      level: level || 'B2',
      targetWords,
      notes: notes || '',
      language: language || 'pt',
    });
    return res.status(200).json(lesson);
  } catch (err: any) {
    console.error('Error in /api/generate-lesson:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate lesson' });
  }
}
