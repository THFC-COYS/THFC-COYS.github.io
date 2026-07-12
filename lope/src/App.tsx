import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Concierge from "./components/Concierge";
import Platform from "./components/Platform";
import MissionControl from "./components/MissionControl";
import Audiences from "./components/Audiences";
import Flow from "./components/Flow";
import Voices from "./components/Voices";
import FinalCta from "./components/FinalCta";
import Footer from "./components/Footer";
import { useReveal } from "./hooks/useReveal";

export type Persona = "teen" | "adult" | null;

export default function App() {
  useReveal();
  const [persona, setPersona] = useState<Persona>(null);

  return (
    <>
      <Header />
      <main>
        <Hero persona={persona} onPickPersona={setPersona} />
        <Concierge persona={persona} />
        <Platform />
        <MissionControl />
        <Audiences />
        <Flow />
        <Voices />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
