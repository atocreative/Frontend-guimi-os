/**
 * Color Configuration Constants
 *
 * Centralized color definitions for semantic consistency across the application.
 * All colors map to Tailwind CSS tokens to maintain design system coherence.
 *
 * Usage:
 * ```tsx
 * import { PRIORITY_COLORS, ALERT_COLORS } from "@/lib/colors-config"
 *
 * <div className={PRIORITY_COLORS.ALTA}>
 *   Prioridade Alta
 * </div>
 * ```
 *
 * Guidelines:
 * - Use 10% opacity for backgrounds (e.g., `bg-red-500/10`)
 * - Use 20% opacity for borders (e.g., `border-red-500/20`)
 * - Use 600 shade for text in those colored backgrounds (e.g., `text-red-600`)
 * - Prefer semantic color names (emerald > green for growth, red for warnings, amber for caution)
 */

// ============================================================================
// PRIORITY & URGENCY COLORS
// ============================================================================

/**
 * Task/Agenda priority level colors
 * Used in: tarefa-card, painel-tarefas, agenda components
 */
export const PRIORITY_COLORS = {
  ALTA: "bg-red-500/10 text-red-600 border-red-500/20",
  MEDIA: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  BAIXA: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
} as const

/**
 * Alert severity levels
 * Used in: painel-alertas, dashboard components
 */
export const ALERT_COLORS = {
  urgente: {
    icon: "text-red-500",
    bg: "border-red-500/20 bg-red-500/5",
  },
  atencao: {
    icon: "text-amber-500",
    bg: "border-amber-500/20 bg-amber-500/5",
  },
  info: {
    icon: "text-blue-500",
    bg: "border-blue-500/20 bg-blue-500/5",
  },
} as const

// ============================================================================
// COMPLETION & STATUS COLORS
// ============================================================================

/**
 * Completion/Progress status colors
 * Used in: checklist-card, progress indicators, completion badges
 * 100% = completed/achieved, other = in-progress/at-risk
 */
export const COMPLETION_COLORS = {
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  inProgress: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  pending: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
} as const

/**
 * Device/Equipment status colors
 * Used in: aparelho-card, operacao components
 */
export const DEVICE_STATUS_COLORS = {
  DISPONIVEL: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  RESERVADO: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  AGUARDANDO_RETIRADA: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  EM_AVALIACAO: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  AVALIADO: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
} as const

/**
 * Device type classification colors
 * Used in: aparelho-card, inventory components
 */
export const DEVICE_TYPE_COLORS = {
  NOVO: "bg-zinc-900 text-white",
  SEMINOVO: "bg-zinc-100 text-zinc-800",
  TRADE_IN: "bg-purple-500/10 text-purple-600",
} as const

// ============================================================================
// PERFORMANCE & ACHIEVEMENT COLORS
// ============================================================================

/**
 * Performance level colors (skills, rankings)
 * Used in: nivel-badge, leaderboard, colaboradores components
 */
export const PERFORMANCE_LEVEL_COLORS = {
  Iniciante: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  Avançado: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Expert: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Lenda: "bg-amber-500/10 text-amber-600 border-amber-500/20",
} as const

/**
 * Meta achievement threshold colors
 * Used in: ranking, performance indicators, colaboradores
 * 100%+ = goal achieved (green), 80-99% = near goal (amber), <80% = at risk (red)
 */
export const META_THRESHOLD_COLORS = {
  achieved: "text-emerald-500", // 100%+
  nearGoal: "text-amber-500", // 80-99%
  atRisk: "text-red-500", // <80%
} as const

/**
 * Podium/Medal colors for top performers
 * Used in: podio, leaderboard components
 */
export const PODIUM_COLORS = {
  gold: {
    emoji: "🥇",
    border: "border-amber-400/40 bg-amber-500/8",
  },
  silver: {
    emoji: "🥈",
    border: "border-zinc-300 bg-zinc-500/6",
  },
  bronze: {
    emoji: "🥉",
    border: "border-stone-400/50 bg-stone-500/8",
  },
} as const

// ============================================================================
// BUSINESS METRICS COLORS
// ============================================================================

/**
 * Lead temperature classification
 * Used in: lead-card, comercial components
 * QUENTE (hot) = ready to convert, MORNO (warm) = engaged, FRIO (cold) = early stage
 */
export const LEAD_TEMPERATURE_COLORS = {
  QUENTE: "bg-red-500/10 text-red-600 border-red-500/20",
  MORNO: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  FRIO: "bg-blue-500/10 text-blue-600 border-blue-500/20",
} as const

/**
 * Lead source origin colors
 * Used in: origem-leads, lead tracking
 * Note: Using emerald for referral (Indicação), not green, for semantic consistency
 */
export const LEAD_SOURCE_COLORS = {
  Instagram: "bg-purple-500",
  Indicacao: "bg-emerald-500", // Semantic: growth/trust
  WhatsApp: "bg-emerald-500", // Semantic: same as Indicacao for consistency
  Google: "bg-blue-500",
} as const

/**
 * Lead conversion rate threshold colors
 * Used in: lead indicators, origem-leads
 * 40%+ = strong conversion (green), 30-39% = moderate (amber), <30% = needs work (red)
 */
export const CONVERSION_RATE_COLORS = {
  strong: "text-emerald-500", // 40%+
  moderate: "text-amber-500", // 30-39%
  weak: "text-red-500", // <30%
} as const

/**
 * Financial metric colors
 * Used in: painel-tarefas, grafico-financeiro, financeiro components
 */
export const FINANCIAL_COLORS = {
  income: "#3b82f6", // blue-500 (HEX for charts)
  expenses: "#ef4444", // red-500 (HEX for charts)
  profit: "#10b981", // emerald-500 (HEX for charts)
  value: "text-emerald-600", // Display for amounts (positive cash flow)
} as const

// ============================================================================
// KPI & ICON BACKGROUND COLORS
// ============================================================================

/**
 * KPI icon background color pairs (icon color + background)
 * Used in: KPI cards, metric displays, inventory components
 * Pattern: icon uses 500 shade, background uses 500/10 opacity
 */
export const KPI_ICON_COLORS = {
  revenue: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  packages: {
    icon: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  analytics: {
    icon: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  warning: {
    icon: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  critical: {
    icon: "text-red-500",
    bg: "bg-red-500/10",
  },
} as const

/**
 * Task summary status colors (completed, pending, overdue, etc)
 * Used in: resumo-time, task dashboards
 */
export const TASK_SUMMARY_COLORS = {
  completed: {
    icon: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  overdue: {
    icon: "text-red-500",
    bg: "bg-red-500/10",
  },
  pending: {
    icon: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  inProgress: {
    icon: "text-blue-500",
    bg: "bg-blue-500/10",
  },
} as const

// ============================================================================
// GAMIFICATION COLORS
// ============================================================================

/**
 * Medal/Achievement badge colors
 * Used in: leaderboard, gamification, ranking components
 */
export const MEDAL_COLORS = {
  "top-ticket": {
    label: "🏆 Maior ticket",
    bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  "mais-leads": {
    label: "🎯 Mais leads",
    bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  "quase-meta": {
    label: "📈 Quase meta",
    bg: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  },
} as const

// ============================================================================
// COMPONENT DEFAULT COLORS
// ============================================================================

/**
 * Avatar component default fallback colors
 * Used throughout app for user avatars with initials
 */
export const AVATAR_DEFAULT = "bg-zinc-900 text-white" as const

/**
 * Chart colors exported as RGB for Recharts compatibility
 * When using Recharts, prefer these hex values for consistency
 */
export const CHART_COLORS_HEX = {
  blue: "#3b82f6",
  red: "#ef4444",
  emerald: "#10b981",
  amber: "#f59e0b",
  purple: "#a855f7",
  orange: "#f97316",
  zinc: "#71717a",
} as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Color severity levels for semantic understanding
 */
export type ColorSeverity = "critical" | "warning" | "info" | "success"

/**
 * Meta achievement status
 */
export type MetaStatus = keyof typeof META_THRESHOLD_COLORS

/**
 * Device status type
 */
export type DeviceStatus = keyof typeof DEVICE_STATUS_COLORS

/**
 * Priority level type
 */
export type PriorityLevel = keyof typeof PRIORITY_COLORS
