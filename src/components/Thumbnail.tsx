import type { Category } from '../data/sampleData';

// Generated placeholder artwork — no real photos are used for sample articles.
const ART: Record<Category, { icon: string; from: string; to: string }> = {
  Technology: { icon: '💻', from: '#dbe8fb', to: '#b9d0f2' },
  Business: { icon: '📈', from: '#e6f2e4', to: '#c6e0c1' },
  Culture: { icon: '🎭', from: '#f6e3ec', to: '#ecc4d6' },
  Science: { icon: '🔬', from: '#e2f1f0', to: '#bfe0dc' },
  Sport: { icon: '⚽', from: '#fbeedd', to: '#f2d5ae' },
  Lifestyle: { icon: '🏡', from: '#ece8f8', to: '#d3cbef' },
};

interface Props {
  category: Category;
  size?: 'sm' | 'lg';
}

export function Thumbnail({ category, size = 'sm' }: Props) {
  const art = ART[category];
  return (
    <div
      className={`thumb thumb--${size}`}
      style={{ background: `linear-gradient(135deg, ${art.from}, ${art.to})` }}
      role="img"
      aria-label={`${category} placeholder thumbnail`}
    >
      <span aria-hidden="true">{art.icon}</span>
    </div>
  );
}
