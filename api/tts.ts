import type { VercelRequest, VercelResponse } from '@vercel/node';
import { synthesizeSpeechWithGemini } from '../server/geminiService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }
    const audio = await synthesizeSpeechWithGemini(text, voice || 'Kore');
    return res.status(200).json({ audio });
  } catch (err: any) {
    console.error('Error in /api/tts:', err);
    return res.status(500).json({ error: err.message || 'TTS synthesis failed' });
  }
}
