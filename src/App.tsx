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
import './app.css';

export function App() {
  useScrollReveal(); // site-wide blur → sharp scroll reveal (after children mount, before paint)
  useMagneticButtons(); // magnetic hover + springy press on the header/footer/go-to-top buttons
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
      <Analytics />
    </>
  );
}
