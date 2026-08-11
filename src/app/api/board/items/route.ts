import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';
import { verifyAdmin } from '@/lib/admin-auth';

function mapItem(item: any) {
  return {
    id: item.id,
    type: item.type,
    filename: item.filename,
    filepath: item.filepath,
    thumbnail: item.thumbnail,
    content: item.content,
    rotation: item.rotation ?? 0,
    x: item.posX ?? 0,
    y: item.posY ?? 0,
    z: item.zIndex ?? 0,
    roast: item.roast,
  };
}

export async function GET() {
  try {
    const items = await db.boardItem.findMany({ orderBy: { zIndex: 'asc' } });
    return NextResponse.json(items.map(mapItem));
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { type, content, posX, posY } = body;

    const maxZ = await db.boardItem.findFirst({
      orderBy: { zIndex: 'desc' }, select: { zIndex: true },
    });

    const item = await db.boardItem.create({
      data: {
        type: type || 'text',
        content: content || 'Type something...',
        posX: posX ?? Math.random() * 600 + 100,
        posY: posY ?? Math.random() * 400 + 100,
        rotation: (Math.random() - 0.5) * 10,
        zIndex: (maxZ?.zIndex ?? 0) + 1,
      },
    });

    return NextResponse.json(mapItem(item));
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { id, posX, posY, rotation, zIndex, content, roast } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (posX !== undefined) updateData.posX = posX;
    if (posY !== undefined) updateData.posY = posY;
    if (rotation !== undefined) updateData.rotation = rotation;
    if (zIndex !== undefined) updateData.zIndex = zIndex;
    if (content !== undefined) updateData.content = content;
    if (roast !== undefined) updateData.roast = roast;

    const item = await db.boardItem.update({ where: { id }, data: updateData });
    return NextResponse.json(mapItem(item));
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const item = await db.boardItem.findUnique({ where: { id } });
    if (item?.filepath) {
      try { await unlink(path.join(process.cwd(), 'public', 'uploads', item.filepath)); } catch { /* */ }
      if (item.thumbnail) {
        try { await unlink(path.join(process.cwd(), 'public', 'uploads', item.thumbnail)); } catch { /* */ }
      }
    }

    await db.boardItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
