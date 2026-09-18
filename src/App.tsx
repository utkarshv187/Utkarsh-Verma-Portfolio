import { Analytics } from '@vercel/analytics/react';
import { Cursor } from './components/Cursor';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WorkExperience } from './components/WorkExperience';
import { RecentWork } from './components/RecentWork';
import { Testimonials } from './components/Testimonials';
import { AboutMe } from './components/AboutMe';
import { Hobbies } from './components/Hobbies';
import './app.css';

export function App() {
  return (
    <>
      <Cursor />
      <Header />
      <main>
        <Hero />
        <WorkExperience />
        <RecentWork />
        <Testimonials />
        <AboutMe />
        <Hobbies />
        {/* Temporary spacer so the page scrolls while later sections are built. */}
        <section className="dev-spacer" />
      </main>
      <Analytics />
    </>
  );
}
