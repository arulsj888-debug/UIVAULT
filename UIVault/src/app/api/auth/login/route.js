import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../../../lib/db';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 });
    response.cookies.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' });

    return response;
  } catch (error) {
    console.error('Login error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
