import { works } from "../data";
import WorksWheel from "./WorksWheels";

export default function Projects() {
  return (
    <section id="projects" data-snap className="h-screen">
      <WorksWheel items={works} label="My Projects" action="View" />
    </section>
  );
}