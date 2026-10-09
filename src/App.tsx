import { MotionConfig } from "framer-motion";
import { useLenis } from "./hooks/useLenis";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Contact from "./components/Contact";
import DarkVeil from "./components/DarkVeil";


export default function App() {
  useLenis();

  return (
    <MotionConfig reducedMotion="user">
      <div className="page-bg">
        {/*
          The veil belongs to the page instead of the Hero, so the animated
          texture continues behind every section until the project transition.
        */}
        <div className="portfolio-background" aria-hidden="true">
          <DarkVeil
            config={{ preset: "Prism", speed: 8 }}
            noise={{ opacity: 0.05, scale: 1 }}
          />
        </div>

        <Navbar />
        <main className="relative z-10">
          <Hero />
          <About />
          <Experience />

          {/* Long, quiet fade from the animated world into solid black. */}
          <div className="projects-transition" aria-hidden="true" />

          <Projects />
        </main>
        <div className="relative z-10">
          <Contact />
        </div>
      </div>
    </MotionConfig>
  );
}
