import { gamificationService, getGamificationLevel, getGamificationProgress, resolveGamificationBadges } from "@/lib/services/gamification-service"
import { gamificationRepository, GamificationRepositoryError } from "@/lib/repositories/gamification-repository"

jest.mock("@/lib/repositories/gamification-repository", () => ({
  gamificationRepository: {
    getLeaderboard: jest.fn(),
    getUserStats: jest.fn(),
  },
  GamificationRepositoryError: class GamificationRepositoryError extends Error {
    status: number
    data?: unknown

    constructor(status: number, message: string, data?: unknown) {
      super(message)
      this.name = "GamificationRepositoryError"
      this.status = status
      this.data = data
    }
  },
}))

describe("gamification service", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ========== LEVEL MAPPING TESTS ==========
  describe("getGamificationLevel", () => {
    it("returns Bronze for 0-100 points", () => {
      expect(getGamificationLevel(0)).toBe("Bronze")
      expect(getGamificationLevel(50)).toBe("Bronze")
      expect(getGamificationLevel(100)).toBe("Bronze")
    })

    it("returns Prata for 101-300 points", () => {
      expect(getGamificationLevel(101)).toBe("Prata")
      expect(getGamificationLevel(150)).toBe("Prata")
      expect(getGamificationLevel(300)).toBe("Prata")
    })

    it("returns Ouro for 301-599 points", () => {
      expect(getGamificationLevel(301)).toBe("Ouro")
      expect(getGamificationLevel(450)).toBe("Ouro")
      expect(getGamificationLevel(599)).toBe("Ouro")
    })

    it("returns Platina for 600+ points", () => {
      expect(getGamificationLevel(600)).toBe("Platina")
      expect(getGamificationLevel(900)).toBe("Platina")
      expect(getGamificationLevel(10000)).toBe("Platina")
    })

    it("handles boundary points correctly", () => {
      // Bronze -> Prata boundary
      expect(getGamificationLevel(100)).toBe("Bronze")
      expect(getGamificationLevel(101)).toBe("Prata")

      // Prata -> Ouro boundary
      expect(getGamificationLevel(300)).toBe("Prata")
      expect(getGamificationLevel(301)).toBe("Ouro")

      // Ouro -> Platina boundary
      expect(getGamificationLevel(599)).toBe("Ouro")
      expect(getGamificationLevel(600)).toBe("Platina")
    })
  })

  // ========== PROGRESS CALCULATION TESTS ==========
  describe("getGamificationProgress", () => {
    it("calculates progress within Bronze (0-100)", () => {
      const progress = getGamificationProgress(80)

      expect(progress.level).toBe("Bronze")
      expect(progress.nextLevel).toBe("Prata")
      expect(progress.levelProgress).toBe(80)
      expect(progress.pointsToNextLevel).toBe(21)
    })

    it("calculates progress within Prata (101-300)", () => {
      const progress = getGamificationProgress(200)

      expect(progress.level).toBe("Prata")
      expect(progress.nextLevel).toBe("Ouro")
      expect(progress.levelProgress).toBeGreaterThan(0)
      expect(progress.levelProgress).toBeLessThanOrEqual(100)
      expect(progress.pointsToNextLevel).toBe(101)
    })

    it("calculates progress within Ouro (301-599)", () => {
      const progress = getGamificationProgress(450)

      expect(progress.level).toBe("Ouro")
      expect(progress.nextLevel).toBe("Platina")
      expect(progress.levelProgress).toBeGreaterThan(0)
      expect(progress.levelProgress).toBeLessThanOrEqual(100)
      expect(progress.pointsToNextLevel).toBe(150)
    })

    it("returns max progress for Platina (600+)", () => {
      const progress = getGamificationProgress(900)

      expect(progress.level).toBe("Platina")
      expect(progress.nextLevel).toBeNull()
      expect(progress.levelProgress).toBe(100)
      expect(progress.pointsToNextLevel).toBe(0)
    })

    it("handles boundary transitions", () => {
      // Exactly at Bronze max
      const bronzeMax = getGamificationProgress(100)
      expect(bronzeMax.level).toBe("Bronze")
      expect(bronzeMax.pointsToNextLevel).toBe(1)

      // Just entered Prata
      const prataMin = getGamificationProgress(101)
      expect(prataMin.level).toBe("Prata")
      expect(prataMin.pointsToNextLevel).toBe(200)
    })

    it("clamps progress between 0-100 percentage", () => {
      const low = getGamificationProgress(101)
      expect(low.levelProgress).toBeGreaterThanOrEqual(0)
      expect(low.levelProgress).toBeLessThanOrEqual(100)

      const mid = getGamificationProgress(200)
      expect(mid.levelProgress).toBeGreaterThanOrEqual(0)
      expect(mid.levelProgress).toBeLessThanOrEqual(100)

      const high = getGamificationProgress(599)
      expect(high.levelProgress).toBeGreaterThanOrEqual(0)
      expect(high.levelProgress).toBeLessThanOrEqual(100)
    })
  })

  // ========== BADGE RESOLUTION TESTS ==========
  describe("resolveGamificationBadges", () => {
    it("resolves known badge (streak)", () => {
      const badges = resolveGamificationBadges(["streak"])

      expect(badges).toHaveLength(1)
      expect(badges[0].id).toBe("streak")
      expect(badges[0].title).toBe("Streak")
      expect(badges[0].emoji).toBe("🔥")
      expect(badges[0].rarity).toBe("raro")
    })

    it("resolves known badge (precise)", () => {
      const badges = resolveGamificationBadges(["precise"])

      expect(badges).toHaveLength(1)
      expect(badges[0].id).toBe("precise")
      expect(badges[0].title).toBe("Precise")
      expect(badges[0].emoji).toBe("🎯")
      expect(badges[0].rarity).toBe("epico")
    })

    it("resolves known badge (superstar)", () => {
      const badges = resolveGamificationBadges(["superstar"])

      expect(badges).toHaveLength(1)
      expect(badges[0].id).toBe("superstar")
      expect(badges[0].title).toBe("Superstar")
      expect(badges[0].emoji).toBe("🌟")
      expect(badges[0].rarity).toBe("epico")
    })

    it("resolves unknown badges with fallback", () => {
      const badges = resolveGamificationBadges(["custom-badge"])

      expect(badges).toHaveLength(1)
      expect(badges[0].id).toBe("custom-badge")
      expect(badges[0].title).toBe("custom-badge")
      expect(badges[0].emoji).toBe("🏅")
      expect(badges[0].rarity).toBe("comum")
    })

    it("resolves multiple mixed badges", () => {
      const badges = resolveGamificationBadges(["streak", "custom-badge", "precise"])

      expect(badges).toHaveLength(3)
      expect(badges[0].id).toBe("streak")
      expect(badges[1].id).toBe("custom-badge")
      expect(badges[2].id).toBe("precise")
    })

    it("handles empty badge list", () => {
      const badges = resolveGamificationBadges([])
      expect(badges).toEqual([])
    })

    it("handles undefined badge list", () => {
      const badges = resolveGamificationBadges()
      expect(badges).toEqual([])
    })

    it("normalizes badge IDs to lowercase", () => {
      const badges = resolveGamificationBadges(["STREAK", "Precise"])

      expect(badges[0].id).toBe("streak")
      expect(badges[1].id).toBe("precise")
    })

    it("trims whitespace from badge IDs", () => {
      const badges = resolveGamificationBadges(["  streak  "])

      expect(badges[0].id).toBe("streak")
    })
  })

  // ========== LEADERBOARD SERVICE TESTS ==========
  describe("gamificationService.getLeaderboard", () => {
    it("maps leaderboard payload and current user rank", async () => {
      ;(gamificationRepository.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "month",
        updatedAt: "2026-04-28T12:00:00.000Z",
        entries: [
          {
            userId: "user-1",
            name: "Ana",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Vendas",
            points: 120,
            badgeIds: ["streak"],
            rank: 2,
          },
        ],
      })

      const result = await gamificationService.getLeaderboard("month", "user-1")

      expect(result.available).toBe(true)
      expect(result.entries[0].level).toBe("Prata")
      expect(result.currentUserRank).toBe(2)
      expect(result.entries[0].badges).toHaveLength(1)
      expect(result.entries[0].badges[0].id).toBe("streak")
    })

    it("handles multiple leaderboard entries with different levels", async () => {
      ;(gamificationRepository.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "month",
        updatedAt: "2026-04-28T12:00:00.000Z",
        entries: [
          {
            userId: "user-1",
            name: "Top User",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Sales",
            points: 800,
            badgeIds: ["superstar"],
            rank: 1,
          },
          {
            userId: "user-2",
            name: "Mid User",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Support",
            points: 250,
            badgeIds: [],
            rank: 2,
          },
        ],
      })

      const result = await gamificationService.getLeaderboard("month", "user-2")

      expect(result.entries).toHaveLength(2)
      expect(result.entries[0].level).toBe("Platina")
      expect(result.entries[1].level).toBe("Bronze")
      expect(result.currentUserRank).toBe(2)
    })

    it("returns unavailable leaderboard on repository error", async () => {
      ;(gamificationRepository.getLeaderboard as jest.Mock).mockRejectedValue(
        new GamificationRepositoryError(503, "Leaderboard indisponível")
      )

      const result = await gamificationService.getLeaderboard("month", "user-1")

      expect(result.available).toBe(false)
      expect(result.entries).toEqual([])
      expect(result.message).toBe("Leaderboard indisponível")
      expect(result.currentUserRank).toBeNull()
    })

    it("returns null rank when current user not in leaderboard", async () => {
      ;(gamificationRepository.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "month",
        updatedAt: "2026-04-28T12:00:00.000Z",
        entries: [
          {
            userId: "user-1",
            name: "Ana",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Sales",
            points: 120,
            badgeIds: [],
            rank: 1,
          },
        ],
      })

      const result = await gamificationService.getLeaderboard("month", "user-999")

      expect(result.currentUserRank).toBeNull()
    })

    it("handles leaderboard without current user ID", async () => {
      ;(gamificationRepository.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "month",
        updatedAt: "2026-04-28T12:00:00.000Z",
        entries: [
          {
            userId: "user-1",
            name: "Ana",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Sales",
            points: 120,
            badgeIds: [],
            rank: 1,
          },
        ],
      })

      const result = await gamificationService.getLeaderboard("month")

      expect(result.available).toBe(true)
      expect(result.currentUserRank).toBeNull()
    })

    it("preserves level from backend when provided", async () => {
      ;(gamificationRepository.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "month",
        updatedAt: "2026-04-28T12:00:00.000Z",
        entries: [
          {
            userId: "user-1",
            name: "Ana",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Sales",
            points: 120,
            level: "Ouro",
            badgeIds: [],
            rank: 1,
          },
        ],
      })

      const result = await gamificationService.getLeaderboard("month")

      expect(result.entries[0].level).toBe("Ouro")
    })

    it("calculates level from points when not provided by backend", async () => {
      ;(gamificationRepository.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "month",
        updatedAt: "2026-04-28T12:00:00.000Z",
        entries: [
          {
            userId: "user-1",
            name: "Ana",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Sales",
            points: 350,
            badgeIds: [],
            rank: 1,
          },
        ],
      })

      const result = await gamificationService.getLeaderboard("month")

      expect(result.entries[0].level).toBe("Ouro")
    })

    it("handles 'all' scope", async () => {
      ;(gamificationRepository.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "all",
        updatedAt: "2026-04-28T12:00:00.000Z",
        entries: [],
      })

      const result = await gamificationService.getLeaderboard("all")

      expect(result.scope).toBe("all")
    })
  })

  // ========== USER STATS SERVICE TESTS ==========
  describe("gamificationService.getUserStats", () => {
    it("maps user stats with calculated progress", async () => {
      ;(gamificationRepository.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "Ana",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 120,
        badgeIds: ["streak"],
        streakDays: 5,
        rank: 2,
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      const result = await gamificationService.getUserStats("user-1")

      expect(result.available).toBe(true)
      expect(result.userId).toBe("user-1")
      expect(result.name).toBe("Ana")
      expect(result.points).toBe(120)
      expect(result.level).toBe("Prata")
      expect(result.streakDays).toBe(5)
      expect(result.rank).toBe(2)
      expect(result.badges).toHaveLength(1)
    })

    it("returns unavailable stats on repository error", async () => {
      ;(gamificationRepository.getUserStats as jest.Mock).mockRejectedValue(
        new GamificationRepositoryError(404, "Gamificação indisponível")
      )

      const result = await gamificationService.getUserStats("user-9")

      expect(result.available).toBe(false)
      expect(result.userId).toBe("user-9")
      expect(result.points).toBe(0)
      expect(result.level).toBe("Bronze")
      expect(result.badges).toEqual([])
    })

    it("calculates progress correctly from points", async () => {
      ;(gamificationRepository.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "User",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 200,
        badgeIds: [],
        streakDays: 0,
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      const result = await gamificationService.getUserStats("user-1")

      expect(result.level).toBe("Prata")
      expect(result.nextLevel).toBe("Ouro")
      expect(result.pointsToNextLevel).toBe(101)
    })

    it("handles null/undefined optional fields", async () => {
      ;(gamificationRepository.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "User",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 50,
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      const result = await gamificationService.getUserStats("user-1")

      expect(result.streakDays).toBe(0)
      expect(result.rank).toBeNull()
      expect(result.badges).toEqual([])
    })

    it("preserves level from backend when provided", async () => {
      ;(gamificationRepository.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "User",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 500,
        level: "Platina",
        badgeIds: [],
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      const result = await gamificationService.getUserStats("user-1")

      expect(result.level).toBe("Platina")
    })

    it("calculates level from points when not provided", async () => {
      ;(gamificationRepository.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "User",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 400,
        badgeIds: [],
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      const result = await gamificationService.getUserStats("user-1")

      expect(result.level).toBe("Ouro")
    })
  })
})
