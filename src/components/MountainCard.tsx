import type { Mountain } from '../data/mountains';
import './MountainCard.css';

interface MountainCardProps {
  mountain: Mountain;
  result?: 'correct' | 'wrong';
  mini?: boolean;
}

export default function MountainCard({ mountain, result, mini }: MountainCardProps) {
  const cls = ['mountain-card', result, mini ? 'mini' : ''].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <img
        className="mountain-card-image"
        src={mountain.imageUrl}
        alt={mountain.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
      />
      <div className="mountain-card-body">
        <div className="mountain-card-name">{mountain.name}</div>
        <div className="mountain-card-meta">
          {mountain.elevation.toLocaleString()}m — {mountain.location}
        </div>
        {!mini && (
          <div className="mountain-card-desc">{mountain.description}</div>
        )}
        {result && (
          <span className={`mountain-card-badge ${result}`}>
            {result === 'correct' ? '正解' : '不正解'}
          </span>
        )}
      </div>
    </div>
  );
}
