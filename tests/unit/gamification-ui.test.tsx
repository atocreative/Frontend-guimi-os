import { render, screen } from "@testing-library/react"
import { Leaderboard } from "@/components/gamificacao/leaderboard"
import { UserStats } from "@/components/gamificacao/user-stats"
import { gamificationService } from "@/lib/services/gamification-service"

jest.mock("@/lib/services/gamification-service", () => ({
  gamificationService: {
    getLeaderboard: jest.fn(),
    getUserStats: jest.fn(),
  },
}))

describe("gamification UI", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders unavailable leaderboard state", async () => {
    ;(gamificationService.getLeaderboard as jest.Mock).mockResolvedValue({
      available: false,
      scope: "month",
      updatedAt: null,
      entries: [],
      currentUserRank: null,
      message: "Leaderboard indisponível no backend no momento.",
    })

    render(<Leaderboard currentUserId="user-1" pollMs={999999} />)

    expect(await screen.findByText("Gamificação indisponível")).toBeInTheDocument()
  })

  it("renders leaderboard entries", async () => {
    ;(gamificationService.getLeaderboard as jest.Mock).mockResolvedValue({
      available: true,
      scope: "month",
      updatedAt: "2026-04-28T12:00:00.000Z",
      currentUserRank: 1,
      entries: [
        {
          userId: "user-1",
          name: "Ana",
          avatarUrl: null,
          role: "COLABORADOR",
          jobTitle: "Vendas",
          points: 150,
          level: "Prata",
          badges: [],
          rank: 1,
        },
      ],
    })

    render(<Leaderboard currentUserId="user-1" pollMs={999999} />)

    expect(await screen.findByText("Ana")).toBeInTheDocument()
    expect(screen.getByText("Prata")).toBeInTheDocument()
  })

  it("renders unavailable user stats state", async () => {
    ;(gamificationService.getUserStats as jest.Mock).mockResolvedValue({
      available: false,
      userId: "user-1",
      name: "",
      avatarUrl: null,
      role: "COLABORADOR",
      points: 0,
      level: "Bronze",
      levelProgress: 0,
      nextLevel: "Prata",
      pointsToNextLevel: 101,
      badges: [],
      streakDays: 0,
      rank: null,
      updatedAt: null,
      message: "Os pontos e badges ainda não estão disponíveis.",
    })

    render(<UserStats userId="user-1" pollMs={999999} />)

    expect(await screen.findByText("Gamificação indisponível")).toBeInTheDocument()
  })
})
