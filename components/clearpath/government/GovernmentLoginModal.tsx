'use client';

import { useState } from 'react';

interface GovernmentLoginModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function GovernmentLoginModal({ onSuccess, onCancel }: GovernmentLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      setError(null);
      onSuccess();
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-[340px] rounded-2xl border border-sky-100 bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-extrabold text-slate-900">Government Sign In</h2>
        <p className="mt-1 text-xs text-slate-500">
          Government mode is restricted to authorized planners.
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Username
            </label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="civ-btn civ-btn--ghost flex-1 justify-center"
          >
            Cancel
          </button>
          <button type="submit" className="civ-btn civ-btn--primary flex-1 justify-center">
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
