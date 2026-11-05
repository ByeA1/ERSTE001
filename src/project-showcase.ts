import {getProject} from './projects';
import './project-showcase.css';

let displayedProject: string | undefined;
export function returnToProjectOverview(){window.dispatchEvent(new Event('design-terminal:project-overview'));}
export function showcaseVisible(){return Boolean(displayedProject);}
/** The native Rhine detail page now provides the project presentation layout. */
export function showProjectShowcase(id?:string, overview=false){
  displayedProject=!overview && getProject(id) ? id : undefined;
  document.documentElement.classList.toggle('cassette-showcase',Boolean(displayedProject));
}
