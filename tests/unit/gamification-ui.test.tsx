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

  // ========== LEADERBOARD COMPONENT TESTS ==========
  describe("Leaderboard component", () => {
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

    it("renders multiple leaderboard entries in order", async () => {
      ;(gamificationService.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "month",
        updatedAt: "2026-04-28T12:00:00.000Z",
        currentUserRank: 2,
        entries: [
          {
            userId: "user-1",
            name: "Top User",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Sales",
            points: 800,
            level: "Platina",
            badges: [{ id: "superstar", title: "Superstar", emoji: "🌟", description: "", rarity: "epico" }],
            rank: 1,
          },
          {
            userId: "user-2",
            name: "Mid User",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Support",
            points: 250,
            level: "Bronze",
            badges: [],
            rank: 2,
          },
        ],
      })

      render(<Leaderboard currentUserId="user-2" pollMs={999999} />)

      const users = await screen.findAllByText(/Top User|Mid User/)
      expect(users).toHaveLength(2)
      expect(screen.getByText("Platina")).toBeInTheDocument()
      expect(screen.getByText("Bronze")).toBeInTheDocument()
    })

    it("highlights current user row", async () => {
      ;(gamificationService.getLeaderboard as jest.Mock).mockResolvedValue({
        available: true,
        scope: "month",
        updatedAt: "2026-04-28T12:00:00.000Z",
        currentUserRank: 1,
        entries: [
          {
            userId: "user-1",
            name: "Current User",
            avatarUrl: null,
            role: "COLABORADOR",
            jobTitle: "Sales",
            points: 150,
            level: "Prata",
            badges: [],
            rank: 1,
          },
        ],
      })

      render(<Leaderboard currentUserId="user-1" pollMs={999999} />)

      const userRow = await screen.findByText("Current User")
      expect(userRow.closest("div")).toHaveClass("border-primary")
    })

    it("displays badge emojis for users with badges", async () => {
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
            jobTitle: "Sales",
            points: 150,
            level: "Prata",
            badges: [
              { id: "streak", title: "Streak", emoji: "🔥", description: "", rarity: "raro" },
              { id: "precise", title: "Precise", emoji: "🎯", description: "", rarity: "epico" },
            ],
            rank: 1,
          },
        ],
      })

      render(<Leaderboard currentUserId="user-1" pollMs={999999} />)

      expect(await screen.findByLabelText("Streak")).toBeInTheDocument()
      expect(screen.getByLabelText("Precise")).toBeInTheDocument()
    })

    it("switches leaderboard scope", async () => {
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
            jobTitle: "Sales",
            points: 150,
            level: "Prata",
            badges: [],
            rank: 1,
          },
        ],
      })

      render(<Leaderboard currentUserId="user-1" pollMs={999999} />)

      expect(await screen.findByText("Ana")).toBeInTheDocument()
      expect(gamificationService.getLeaderboard).toHaveBeenCalledWith("month", "user-1")
    })
  })

  // ========== USER STATS COMPONENT TESTS ==========
  describe("UserStats component", () => {
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

    it("renders available user stats", async () => {
      ;(gamificationService.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "Ana",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 150,
        level: "Prata",
        levelProgress: 50,
        nextLevel: "Ouro",
        pointsToNextLevel: 151,
        badges: [{ id: "streak", title: "Streak", emoji: "🔥", description: "", rarity: "raro" }],
        streakDays: 5,
        rank: 2,
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      render(<UserStats userId="user-1" pollMs={999999} />)

      expect(await screen.findByText("150")).toBeInTheDocument()
      expect(screen.getByText("Prata")).toBeInTheDocument()
    })

    it("displays streak days when available", async () => {
      ;(gamificationService.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "Ana",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 150,
        level: "Prata",
        levelProgress: 50,
        nextLevel: "Ouro",
        pointsToNextLevel: 151,
        badges: [],
        streakDays: 7,
        rank: 2,
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      render(<UserStats userId="user-1" pollMs={999999} />)

      expect(await screen.findByText(/7/)).toBeInTheDocument()
    })

    it("shows zero state for new users", async () => {
      ;(gamificationService.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-999",
        name: "New User",
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
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      render(<UserStats userId="user-999" pollMs={999999} />)

      const points = await screen.findByText("0")
      expect(points).toBeInTheDocument()
      expect(screen.getByText("Bronze")).toBeInTheDocument()
    })

    it("displays badges when available", async () => {
      ;(gamificationService.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "Ana",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 300,
        level: "Ouro",
        levelProgress: 75,
        nextLevel: "Platina",
        pointsToNextLevel: 300,
        badges: [
          { id: "streak", title: "Streak", emoji: "🔥", description: "", rarity: "raro" },
          { id: "precise", title: "Precise", emoji: "🎯", description: "", rarity: "epico" },
        ],
        streakDays: 10,
        rank: 1,
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      render(<UserStats userId="user-1" pollMs={999999} />)

      expect(await screen.findByText("300")).toBeInTheDocument()
      expect(screen.getByText("Ouro")).toBeInTheDocument()
    })

    it("uses custom poll interval", async () => {
      ;(gamificationService.getUserStats as jest.Mock).mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "Ana",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 150,
        level: "Prata",
        levelProgress: 50,
        nextLevel: "Ouro",
        pointsToNextLevel: 151,
        badges: [],
        streakDays: 0,
        rank: 2,
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      render(<UserStats userId="user-1" pollMs={5000} />)

      expect(await screen.findByText("Prata")).toBeInTheDocument()
    })
  })

  // ========== MEMOIZATION BEHAVIOR TESTS ==========
  describe("memoization and re-render optimization", () => {
    it("LeaderboardRow component doesn't re-render on unrelated prop changes", async () => {
      const getLeaderboardMock = gamificationService.getLeaderboard as jest.Mock
      getLeaderboardMock.mockResolvedValue({
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
            jobTitle: "Sales",
            points: 150,
            level: "Prata",
            badges: [],
            rank: 1,
          },
        ],
      })

      const { rerender } = render(<Leaderboard currentUserId="user-1" pollMs={999999} />)

      await screen.findByText("Ana")

      const callCountBefore = getLeaderboardMock.mock.calls.length
      rerender(<Leaderboard currentUserId="user-1" pollMs={999999} />)

      expect(getLeaderboardMock.mock.calls.length).toBe(callCountBefore)
    })

    it("UserStats useMemo optimizes badge list computation", async () => {
      const getUserStatsMock = gamificationService.getUserStats as jest.Mock
      getUserStatsMock.mockResolvedValue({
        available: true,
        userId: "user-1",
        name: "Ana",
        avatarUrl: null,
        role: "COLABORADOR",
        points: 150,
        level: "Prata",
        levelProgress: 50,
        nextLevel: "Ouro",
        pointsToNextLevel: 151,
        badges: [
          { id: "streak", title: "Streak", emoji: "🔥", description: "", rarity: "raro" },
          { id: "precise", title: "Precise", emoji: "🎯", description: "", rarity: "epico" },
        ],
        streakDays: 5,
        rank: 2,
        updatedAt: "2026-04-28T12:00:00.000Z",
      })

      render(<UserStats userId="user-1" pollMs={999999} />)

      expect(await screen.findByText("Prata")).toBeInTheDocument()
    })
  })
})
