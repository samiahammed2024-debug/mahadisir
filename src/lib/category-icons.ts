import {
  Shirt,
  Footprints,
  Watch,
  Sparkles,
  Crown,
  BookOpen,
  Monitor,
  Home,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  panjabi: Shirt,
  shoes: Footprints,
  watch: Watch,
  attar: Sparkles,
  tupi: Crown,
  shirt: Shirt,
  islamic: BookOpen,
  // Fallbacks
  electronics: Monitor,
  fashion: Shirt,
  home: Home,
  beauty: Sparkles,
  sports: Dumbbell,
};
