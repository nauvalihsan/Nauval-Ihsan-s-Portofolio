import { contact } from "../data";
import SplitHeading from "./SplitHeading";

export default function Contact() {
  return (
    <footer className="bg-[linear-gradient(to_bottom,#000_0%,#9a9a9a_30%,#fafafa_50%)] text-black">
      {/* Zona transisi hitam ke putih */}
      <div className="h-[50vh]" aria-hidden />

      <div id="contact" className="flex min-h-screen flex-col px-6 pb-10 pt-24 md:px-12 md:pt-28">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          <SplitHeading
            once={false}
            delay={0.2}
            className="text-[clamp(3.5rem,11vw,10rem)] font-bold leading-[0.95] tracking-tight"
          >
            Get in touch
          </SplitHeading>

          <ul className="mt-10">
            {contact.map((c, i) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target={c.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="block w-fit text-[clamp(2.25rem,5.5vw,4.5rem)] font-bold leading-[1.05] tracking-tight transition-all duration-300 hover:translate-x-3 hover:text-accent-dark"
                >
                  <SplitHeading as="div" once={false} delay={0.5 + i * 0.1}>
                    {c.label}
                  </SplitHeading>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex justify-end pt-16">
            <a href="#home" className="underline underline-offset-4 transition-colors hover:text-accent-dark">
              Back to Top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}