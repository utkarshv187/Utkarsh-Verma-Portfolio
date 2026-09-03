import { Analytics } from '@vercel/analytics/react';
import { Cursor } from './components/Cursor';
import { Header } from './components/Header';
import './app.css';

export function App() {
  return (
    <>
      <Cursor />
      <Header />
      <main id="home">
        {/* Hero background base (full hero content is the next section). Kept so the
            translucent header renders over the real backdrop for accurate comparison. */}
        <section className="hero-base" aria-hidden="true" />
        {/* Temporary spacer so the page scrolls and the progress bar is exercised. */}
        <section className="dev-spacer" />
      </main>
      <Analytics />
    </>
  );
}
