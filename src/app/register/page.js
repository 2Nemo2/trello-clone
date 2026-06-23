"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Hiba történt!");
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }
  return (
    <main className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🎯 Regisztráció
        </h1>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Majdnem kész!
            </h2>
            <p className="text-gray-600 text-sm">
              Küldtünk egy hitelesítő emailt a megadott címre. Kattints a benne
              lévő linkre a regisztráció befejezéséhez.
            </p>
            <a
              href="/login"
              className="text-blue-600 hover:underline text-sm mt-4 block"
            >
              Vissza a bejelentkezéshez
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Teljes név"
              required
              className="border rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email cím"
              required
              className="border rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Jelszó"
              required
              minLength={6}
              className="border rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? "Regisztráció..." : "Regisztráció"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Már van fiókod?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Bejelentkezés
          </Link>
        </p>
      </div>
    </main>
  );
}
