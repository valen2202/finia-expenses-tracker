import { Category } from '@/types/expense';
import { CATEGORY_BADGE_CLASSES, CATEGORY_EMOJIS } from '@/lib/categories';

interface BadgeProps {
  category: Category;
  showEmoji?: boolean;
}

export default function Badge({ category, showEmoji = true }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_BADGE_CLASSES[category]}`}
    >
      {showEmoji && <span className="text-xs">{CATEGORY_EMOJIS[category]}</span>}
      {category}
    </span>
  );
}
