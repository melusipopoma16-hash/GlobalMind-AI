import {
  Atom,
  Briefcase,
  Globe,
  GraduationCap,
  Languages,
  Laptop,
  Lightbulb,
} from 'lucide-react';
import type { TopicId } from '../types/chat';

interface TopicIconProps {
  topicId: TopicId;
  className?: string;
}

export function TopicIcon({ topicId, className = 'w-5 h-5' }: TopicIconProps) {
  switch (topicId) {
    case 'education':
      return <GraduationCap className={className} aria-hidden="true" />;
    case 'technology':
      return <Laptop className={className} aria-hidden="true" />;
    case 'business':
      return <Briefcase className={className} aria-hidden="true" />;
    case 'science':
      return <Atom className={className} aria-hidden="true" />;
    case 'language':
      return <Languages className={className} aria-hidden="true" />;
    case 'creative':
      return <Lightbulb className={className} aria-hidden="true" />;
    case 'general':
    default:
      return <Globe className={className} aria-hidden="true" />;
  }
}
