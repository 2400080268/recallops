import React from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Brain,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  CreditCard,
  Database,
  ExternalLink,
  FileCheck,
  FileCode2,
  FileText,
  FileWarning,
  Flame,
  Gauge,
  History,
  Info,
  Key,
  Layers,
  LayoutDashboard,
  Lightbulb,
  List,
  ListChecks,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  TrendingUp,
  User,
  Wand2,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

const icons: Record<string, LucideIcon> = {
  // Navigation & Core
  grid_view: LayoutDashboard,
  dashboard: LayoutDashboard,
  bolt: Zap,
  emergency: AlertTriangle,
  psychology: Brain,
  tune: SlidersHorizontal,
  settings: Settings,
  notifications: Bell,
  person: User,
  chevron_right: ChevronRight,

  // KPI & Metric Indicators
  report_problem: AlertTriangle,
  local_fire_department: Flame,
  autorenew: RefreshCw,
  check_circle: CheckCircle2,
  trending_up: TrendingUp,
  arrow_forward: ArrowRight,
  verified: ShieldCheck,
  warning: AlertTriangle,

  // Panels & Actions
  list_alt: List,
  insights: Lightbulb,
  science: Gauge,
  shopping_cart_checkout: ShoppingCart,
  credit_card: CreditCard,
  database: Database,
  memory: Cpu,
  receipt_long: FileText,
  key: Key,
  manage_search: Search,
  custom: SlidersHorizontal,

  // Investigation & Details
  history_toggle_off: History,
  checklist: ListChecks,
  smart_toy: Bot,
  check: Check,
  done_all: CheckCheck,
  report: AlertOctagon,
  travel_explore: Search,
  open_in_new: ExternalLink,
  terminal: Terminal,
  monitoring: Activity,
  timeline: History,
  info: Info,
  share: Layers,
  notification_important: ShieldAlert,
  restart_alt: RotateCcw,
  auto_fix_high: Wand2,
  sparkles: Sparkles,

  // Utility
  search: Search,
  copy: Copy,
  lock: Lock,
  server: Server,
  shield: Shield,
  clock: Clock,
  build: Wrench,
  code: FileCode2,
  file_check: FileCheck,
};

export function Icon({ name, className = "", size = 18 }: IconProps) {
  const LucideComponent = icons[name] ?? Activity;
  return <LucideComponent className={className} size={size} strokeWidth={1.8} />;
}