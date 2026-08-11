import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { readFile } from 'fs/promises';
import path from 'path';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { itemId, filepath } = await request.json();
    if (!itemId || !filepath) {
      return NextResponse.json({ error: 'Missing itemId or filepath' }, { status: 400 });
    }

    const zai = await ZAI.create();
    // Look in public/uploads first, then fallback to uploads
    let photoPath = path.join(process.cwd(), 'public', 'uploads', filepath);
    let imageBuffer: Buffer;
    try {
      imageBuffer = await readFile(photoPath);
    } catch {
      photoPath = path.join(process.cwd(), 'uploads', filepath);
      try {
        imageBuffer = await readFile(photoPath);
      } catch {
        return NextResponse.json({ roast: 'AI boss eka maruwa... try again later' });
      }
    }

    const base64 = imageBuffer.toString('base64');

    const visionResponse = await zai.chat.completions.createVision({
      model: 'glm-4v-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Look at this photo. It's from a friend's chat - probably a funny/candid photo meant for roasting. Give me ONE short, hilarious roasting comment in Sri Lankan Singlish (Sinhala written in English letters mixed with English). Keep it under 15 words. Be savage but funny, not mean. Examples: "aiyo mata pinawa... kiyala thiyenawa eka blala", "bro face eka look like paratha", "sir please... photoshop eka use karanna". Just the roast text, nothing else.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    } as any);

    const roast = visionResponse.choices[0]?.message?.content?.trim() || 'No comment';
    return NextResponse.json({ roast });
  } catch (error) {
    console.error('Roast error:', error);
    return NextResponse.json({ roast: 'AI boss eka maruwa... try again later' });
  }
}
