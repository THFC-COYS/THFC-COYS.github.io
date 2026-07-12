import Header from "./components/Header";
import Hero from "./components/Hero";
import Concierge from "./components/Concierge";
import Platform from "./components/Platform";
import Audiences from "./components/Audiences";
import Flow from "./components/Flow";
import Voices from "./components/Voices";
import FinalCta from "./components/FinalCta";
import Footer from "./components/Footer";
import { useReveal } from "./hooks/useReveal";

export default function App() {
  useReveal();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Concierge />
        <Platform />
        <Audiences />
        <Flow />
        <Voices />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
