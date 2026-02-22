// web/src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/auth";

export default function Login() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("[login] try", email);
      await login(email, password);
      console.log("[login] success → /");
      nav("/");
    } catch (e: any) {
      console.error("[login] error", e);
      alert(String(e?.message ?? e));
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        maxWidth: 400,
        margin: "40px auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <h2>login</h2>

      <label>email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />

      <label>password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">signIn</button>

      <small>Создание пользователей делает Admin (вкладка Admin → Users)</small>
    </form>
  );
}