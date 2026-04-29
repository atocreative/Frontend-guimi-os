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

  it("maps levels correctly", () => {
    expect(getGamificationLevel(0)).toBe("Bronze")
    expect(getGamificationLevel(150)).toBe("Prata")
    expect(getGamificationLevel(450)).toBe("Ouro")
    expect(getGamificationLevel(900)).toBe("Platina")
  })

  it("computes progress to the next level", () => {
    expect(getGamificationProgress(80)).toEqual({
      level: "Bronze",
      nextLevel: "Prata",
      levelProgress: 80,
      pointsToNextLevel: 21,
    })
  })

  it("resolves known and unknown badges", () => {
    const badges = resolveGamificationBadges(["streak", "custom-badge"])

    expect(badges[0].title).toBe("Streak")
    expect(badges[1].id).toBe("custom-badge")
  })

  it("returns unavailable leaderboard on repository failure", async () => {
    ;(gamificationRepository.getLeaderboard as jest.Mock).mockRejectedValue(
      new GamificationRepositoryError(503, "Leaderboard indisponível")
    )

    const result = await gamificationService.getLeaderboard("month", "user-1")

    expect(result.available).toBe(false)
    expect(result.entries).toEqual([])
    expect(result.message).toBe("Leaderboard indisponível")
  })

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
  })

  it("returns unavailable user stats on repository failure", async () => {
    ;(gamificationRepository.getUserStats as jest.Mock).mockRejectedValue(
      new GamificationRepositoryError(404, "Gamificação indisponível")
    )

    const result = await gamificationService.getUserStats("user-9")

    expect(result.available).toBe(false)
    expect(result.userId).toBe("user-9")
    expect(result.points).toBe(0)
  })
})
