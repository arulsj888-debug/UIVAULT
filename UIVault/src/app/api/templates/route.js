import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), 'public', 'templates');
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json([]); // Return empty if no templates added yet
    }

    const folders = fs.readdirSync(templatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    return NextResponse.json(folders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read templates' }, { status: 500 });
  }
}
