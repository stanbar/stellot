"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "./Logo";

interface NavLink {
  href: string;
  label: string;
}

export default function Nav({ links }: { links: NavLink[] }) {
  const [theme, setTheme] = useState<string>("dark");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") ?? "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("stellot-theme", next); } catch {}
  }

  return (
    <nav>
      <Link href="/" className="logo-wrap">
        <Logo size="sm" color="currentColor" />
      </Link>
      {links.map((l) => (
        <Link key={l.href} href={l.href}>{l.label}</Link>
      ))}
      <button className="theme-toggle" onClick={toggle} aria-label="Toggle light/dark theme">
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </nav>
  );
}
