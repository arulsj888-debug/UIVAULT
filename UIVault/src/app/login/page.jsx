"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push('/');
      router.refresh(); // Forces middleware to re-evaluate
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login to UIVault</h2>
        <input className="w-full p-3 border rounded mb-4" type="text" placeholder="Username" required
          onChange={e => setForm({...form, username: e.target.value})} />
        <input className="w-full p-3 border rounded mb-6" type="password" placeholder="Password" required
          onChange={e => setForm({...form, password: e.target.value})} />
        <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">Login</button>
        <p className="mt-4 text-center text-sm">Need an account? <Link href="/register" className="text-blue-500">Sign up</Link></p>
      </form>
    </div>
  );
}
