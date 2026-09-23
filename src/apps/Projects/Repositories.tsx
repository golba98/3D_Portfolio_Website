import { profile } from '../../data/profile';
import { reposSection } from '../../data/repos';
import { useGithubRepos } from '../../hooks/useGithubRepos';
import { Icon } from '../../components/icons/Icon';
import ui from '../shared/ui.module.css';
import styles from './Projects.module.css';

const dateFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });

export function Repositories() {
  const { repos, source, publicCount } = useGithubRepos();

  return (
    <section className={styles.detail} aria-labelledby="repos-heading">
      <p className={ui.eyebrow}>{reposSection.eyebrow}</p>
      <h2 id="repos-heading" className={ui.h1}>
        {reposSection.heading}
      </h2>
      <p className={ui.lede} role="status">
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

      <ul className={styles.repoGrid}>
        {repos.map((repo) => (
          <li key={repo.name} className={styles.repo}>
            <a className={styles.repoName} href={repo.url} target="_blank" rel="noreferrer">
              {repo.name}
            </a>
            <p className={`${ui.small} ${ui.muted}`}>{repo.description || 'No description.'}</p>
            {(repo.language || repo.updatedAt) && (
              <p className={styles.repoMeta}>
                {repo.language && <span>{repo.language}</span>}
                {repo.stars ? <span>★ {repo.stars}</span> : null}
                {repo.updatedAt && <span>Updated {dateFormat.format(new Date(repo.updatedAt))}</span>}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className={ui.actions}>
        <a className={ui.button} href={`${profile.github}?tab=repositories`} target="_blank" rel="noreferrer">
          <Icon name="github" /> {reposSection.viewAll}
        </a>
      </div>
    </section>
  );
}
