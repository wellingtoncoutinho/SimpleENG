import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateWeeklyPlanWithGemini } from '../server/geminiService.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, level, rawNotes, parsedItems, classDay, dailyMinutesGoal } = req.body || {};
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
    });
    return res.status(200).json(plan);
  } catch (err: any) {
    console.error('Error in /api/generate-weekly-plan:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate weekly plan' });
  }
}
