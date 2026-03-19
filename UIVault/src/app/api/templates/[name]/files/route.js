import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const fileMap = {
  html: 'index.html',
  css: 'style.css',
  js: 'script.js',
  pug: 'index.pug',
  scss: 'style.scss',
};

export async function GET(req, { params }) {
  const { name } = await params;
  const templateDir = path.join(process.cwd(), 'public', 'templates', name);

  const available = Object.entries(fileMap)
    .filter(([, filename]) => fs.existsSync(path.join(templateDir, filename)))
    .map(([tab]) => tab);

  return NextResponse.json({ files: available });
}
