import { fireEvent, render, screen } from "@testing-library/react"
import { EmailForm } from "@/components/support/email-form"
import { supportEmailSchema } from "@/lib/schemas"

describe("support email form", () => {
  const originalOpen = window.open

  beforeEach(() => {
    window.open = jest.fn()
  })

  afterEach(() => {
    window.open = originalOpen
  })

  // ========== RENDERING TESTS ==========
  describe("rendering", () => {
    it("renders support destination email", () => {
      render(<EmailForm />)

      expect(screen.getByText(/suporte@guimicell.com.br/i)).toBeInTheDocument()
    })

    it("renders all form input fields", () => {
      render(<EmailForm />)

      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/assunto/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mensagem/i)).toBeInTheDocument()
    })

    it("renders submit button", () => {
      render(<EmailForm />)

      expect(screen.getByRole("button", { name: /enviar para o suporte/i })).toBeInTheDocument()
    })
  })

  // ========== VALIDATION TESTS ==========
  describe("form validation", () => {
    it("shows validation errors when submitting empty fields", async () => {
      render(<EmailForm />)

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })

    it("rejects invalid email format", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "John" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "not-an-email" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Message content here with enough chars" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/email/i)).toBeInTheDocument()
    })

    it("rejects empty name field", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "test@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Message content" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()
    })

    it("rejects message shorter than 10 characters", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "John" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "john@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Short" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/pelo menos 10 caracteres/i)).toBeInTheDocument()
    })

    it("accepts valid message (10+ characters)", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "John" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "john@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Valid message content" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/cliente de e-mail foi acionado/i)).toBeInTheDocument()
    })

    it("rejects email with whitespace only", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "John" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "   " } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Message content" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/email inválido/i)).toBeInTheDocument()
    })

    it("rejects name with whitespace only", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "   " } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "john@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Message content" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()
    })

    it("rejects subject with whitespace only", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "John" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "john@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "   " } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Message content" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/assunto/i)).toBeInTheDocument()
    })

    it("accepts long message (up to 5000 chars)", async () => {
      render(<EmailForm />)

      const longMessage = "A".repeat(5000)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "John" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "john@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: longMessage } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/cliente de e-mail foi acionado/i)).toBeInTheDocument()
    })

    it("rejects message longer than 5000 characters", async () => {
      render(<EmailForm />)

      const tooLongMessage = "A".repeat(5001)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "John" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "john@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: tooLongMessage } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/5000 caracteres/i)).toBeInTheDocument()
    })
  })

  // ========== FORM SUBMISSION TESTS ==========
  describe("form submission", () => {
    it("opens the mail client with filled data", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Caio" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "caio@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Preciso de ajuda" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Mensagem de suporte com detalhes suficientes." } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/cliente de e-mail foi acionado/i)).toBeInTheDocument()
      expect(window.open).toHaveBeenCalled()
    })

    it("calls window.open with mailto URL", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "John Doe" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "john@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Help Request" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "I need assistance with the system" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      await screen.findByText(/cliente de e-mail foi acionado/i)

      expect(window.open).toHaveBeenCalled()
      const callArg = (window.open as jest.Mock).mock.calls[0][0]
      expect(callArg).toContain("mailto:")
      expect(callArg).toContain("suporte@guimicell.com.br")
    })

    it("doesn't submit when validation fails", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "" } })
      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      await screen.findByText(/nome é obrigatório/i)

      expect(window.open).not.toHaveBeenCalled()
    })

    it("shows success message after valid submission", async () => {
      render(<EmailForm />)

      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Test User" } })
      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "test@example.com" } })
      fireEvent.change(screen.getByLabelText(/assunto/i), { target: { value: "Test Subject" } })
      fireEvent.change(screen.getByLabelText(/mensagem/i), { target: { value: "Test message content here" } })

      fireEvent.click(screen.getByRole("button", { name: /enviar para o suporte/i }))

      expect(await screen.findByText(/cliente de e-mail foi acionado/i)).toBeInTheDocument()
    })
  })

  // ========== ZOD SCHEMA VALIDATION TESTS ==========
  describe("supportEmailSchema validation", () => {
    it("validates correct email format", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Help needed",
        message: "This is a help message with enough content",
      }

      const result = supportEmailSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("rejects invalid email format", () => {
      const invalidData = {
        name: "John Doe",
        email: "not-an-email",
        subject: "Help needed",
        message: "This is a help message with enough content",
      }

      const result = supportEmailSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("email"))).toBe(true)
      }
    })

    it("rejects empty name", () => {
      const invalidData = {
        name: "",
        email: "john@example.com",
        subject: "Help needed",
        message: "This is a help message with enough content",
      }

      const result = supportEmailSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("rejects empty subject", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "",
        message: "This is a help message with enough content",
      }

      const result = supportEmailSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("rejects message shorter than 10 characters", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Help",
        message: "Short",
      }

      const result = supportEmailSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("accepts message with exactly 10 characters", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Help",
        message: "1234567890",
      }

      const result = supportEmailSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("rejects message longer than 5000 characters", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Help",
        message: "A".repeat(5001),
      }

      const result = supportEmailSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("accepts message with exactly 5000 characters", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "Help",
        message: "A".repeat(5000),
      }

      const result = supportEmailSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("rejects name longer than 255 characters", () => {
      const invalidData = {
        name: "A".repeat(256),
        email: "john@example.com",
        subject: "Help",
        message: "This is a help message with enough content",
      }

      const result = supportEmailSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("accepts name with exactly 255 characters", () => {
      const validData = {
        name: "A".repeat(255),
        email: "john@example.com",
        subject: "Help",
        message: "This is a help message with enough content",
      }

      const result = supportEmailSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("rejects subject longer than 255 characters", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        subject: "A".repeat(256),
        message: "This is a help message with enough content",
      }

      const result = supportEmailSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("trims whitespace from all fields", () => {
      const data = {
        name: "  John Doe  ",
        email: "  john@example.com  ",
        subject: "  Help needed  ",
        message: "  This is a help message with enough content  ",
      }

      const result = supportEmailSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("John Doe")
        expect(result.data.email).toBe("john@example.com")
        expect(result.data.subject).toBe("Help needed")
        expect(result.data.message).toContain("This is a help message with enough content")
      }
    })
  })
})
