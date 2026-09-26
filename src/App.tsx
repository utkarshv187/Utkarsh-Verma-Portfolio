import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Cursor } from './components/Cursor';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WorkExperience } from './components/WorkExperience';
import { RecentWork } from './components/RecentWork';
import { Testimonials } from './components/Testimonials';
import { AboutMe } from './components/AboutMe';
import { Hobbies } from './components/Hobbies';
import { Footer } from './components/Footer';
import { GoToTop } from './components/GoToTop';
import { useScrollReveal } from './lib/scrollReveal';
import { useMagneticButtons } from './lib/magnetic';
import { useButtonSounds } from './lib/sound';
import { SoundToggle } from './components/SoundToggle';
import './app.css';

export function App() {
  useScrollReveal(); // site-wide fade + rise scroll reveal (after children mount, before paint)
  useMagneticButtons(); // magnetic hover + springy press on the header/footer/go-to-top buttons
  useButtonSounds(); // button hover tick + click (silent unless the visitor turned sound on)
  // page-load intro (flag set in index.html before first paint): drop it once the ~0.7s settle has
  // actually FINISHED, so it runs exactly once per load. Keyed off animationend rather than a timer
  // from mount, because the animations only start at the first rendered frame, which can come later.
  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('is-intro')) return;
    const done = () => {
      root.classList.remove('is-intro');
      document.removeEventListener('animationend', onEnd);
      window.clearTimeout(fallback);
    };
    const onEnd = (e: AnimationEvent) => {
      if (!e.animationName.startsWith('intro-')) return;
      const left = document.getAnimations().some((a) => (a as CSSAnimation).animationName?.startsWith('intro-') && a.playState !== 'finished');
      if (!left) done();
    };
    document.addEventListener('animationend', onEnd);
    const fallback = window.setTimeout(done, 3000); // safety net (e.g. a background tab never animates)
    // cleanup only detaches (StrictMode's dev remount must not end the intro early)
    return () => { document.removeEventListener('animationend', onEnd); window.clearTimeout(fallback); };
  }, []);
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
        <Footer />
      </main>
      <GoToTop />
      <SoundToggle />
      <Analytics />
    </>
  );
}
