import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeDaySpeechWithGemini } from '../server/geminiService.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioBase64, mimeType, liveTranscript, userLevel, targetWords } = req.body || {};
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
    return res.status(200).json(analysis);
  } catch (err: any) {
    console.error('Error in /api/analyze-day-speech:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze day speech' });
  }
}
