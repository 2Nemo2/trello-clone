"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Hibás email vagy jelszó, vagy hitelesítetlen email cím!");
      setLoading(false);
    } else {
      router.push("/");
    }
  }
  return (
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🎯 Trello Klón
      </h1>
      {verified && (
        <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg mb-4">
          ✅ Email sikeresen hitelesítve! Most már bejelentkezhetsz.
        </div>
      )}
      {errorParam === "invalid_token" && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">
          ❌ Érvénytelen vagy lejárt hitelesítő link.
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
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
          className="border rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {loading ? "Bejelentkezés..." : "Bejelentkezés"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Még nincs fiókod?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Regisztráció
        </Link>
      </p>
    </div>
  );
}
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Betöltés...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
