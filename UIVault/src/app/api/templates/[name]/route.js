import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req, { params }) {
  const { name } = await params;
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file'); // html, css, js, pug, scss

  const templateDir = path.join(process.cwd(), 'public', 'templates', name);

  const fileMap = {
    html: 'index.html',
    css: 'style.css',
    js: 'script.js',
    pug: 'index.pug',
    scss: 'style.scss',
  };

  const filename = fileMap[file];
  if (!filename) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });

  const filePath = path.join(templateDir, filename);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return NextResponse.json({ content });
}
