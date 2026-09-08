import { Analytics } from '@vercel/analytics/react';
import { Cursor } from './components/Cursor';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WorkExperience } from './components/WorkExperience';
import './app.css';

export function App() {
  return (
    <>
      <Cursor />
      <Header />
      <main>
        <Hero />
        <WorkExperience />
        {/* Temporary spacer so the page scrolls while later sections are built. */}
        <section className="dev-spacer" />
      </main>
      <Analytics />
    </>
  );
}
