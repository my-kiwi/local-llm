import { Chat } from './chat';
import { GithubLink } from './GithubLink';

export const App = (): string => {
  return `
    <main>
      ${Chat()}
    </main>
    <footer>
      ${GithubLink()}
    </footer>
    `;
};
