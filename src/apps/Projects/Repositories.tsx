import { profile } from '../../data/profile';
import { reposSection } from '../../data/repos';
import { useGithubRepos } from '../../hooks/useGithubRepos';
import { ActionRow } from '../shared/ActionRow';
import ui from '../shared/ui.module.css';
import styles from './Projects.module.css';

const dateFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });

export function Repositories() {
  const { repos, source, publicCount } = useGithubRepos();

  return (
    <section className={`${ui.page} ${ui.narrow}`} aria-labelledby="repos-heading">
      <h2 id="repos-heading" className={ui.groupTitle}>
        {reposSection.heading}
      </h2>
      <p className={ui.groupDescription} role="status">
        {source === 'live' && publicCount !== null ? (
          <>
            Live from{' '}
            <a className={ui.link} href={profile.github} target="_blank" rel="noreferrer">
              @{profile.githubUsername}
            </a>{' '}
            · {publicCount} public repos.
          </>
        ) : source === 'unreachable' ? (
          <>{reposSection.unreachable} Showing the saved list.</>
        ) : (
          <>Checking GitHub…</>
        )}
      </p>

      <ul className={ui.list}>
        {repos.map((repo) => (
          <ActionRow key={repo.name} title={repo.name} subtitle={repo.description || 'No description.'} href={repo.url}>
            {(repo.language || repo.updatedAt) && (
              <span className={styles.repoMeta}>
                {repo.language && <span>{repo.language}</span>}
                {repo.stars ? <span>★ {repo.stars}</span> : null}
                {repo.updatedAt && <span>Updated {dateFormat.format(new Date(repo.updatedAt))}</span>}
              </span>
            )}
          </ActionRow>
        ))}
      </ul>

      <ul className={`${ui.list} ${ui.section}`}>
        <ActionRow icon="github" title={reposSection.viewAll} href={`${profile.github}?tab=repositories`} />
      </ul>
    </section>
  );
}
